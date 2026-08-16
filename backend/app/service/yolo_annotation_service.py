from pathlib import Path
import json
import uuid

from fastapi import HTTPException, status

from app.schema.yolo_annotation import (
    YoloBoxAnnotation,
    YoloBoxCreateRequest,
    YoloBoxListResponse,
    YoloBoxUpdateRequest,
)
from app.schema.yolo_label import YoloLabelCreateRequest
from app.service.yolo_label_service import YoloLabelService

BACKEND_ROOT = Path(__file__).resolve().parents[2]
FRAMES_ROOT = BACKEND_ROOT / "yolo" / "workspace" / "frames"
LABELS_ROOT = BACKEND_ROOT / "yolo" / "workspace" / "labels"


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


class YoloAnnotationService:
    def __init__(self) -> None:
        self.labels = YoloLabelService()
        LABELS_ROOT.mkdir(parents=True, exist_ok=True)

    def _session_dir(self, session_id: str) -> Path:
        return LABELS_ROOT / session_id

    def _ann_path(self, session_id: str) -> Path:
        return self._session_dir(session_id) / "annotations.json"

    def _ensure_frame(self, session_id: str, frame: str) -> None:
        path = FRAMES_ROOT / session_id / frame
        if not path.is_file():
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                detail=f"프레임을 찾을 수 없습니다: {frame}",
            )

    def _load(self, session_id: str) -> list[dict]:
        path = self._ann_path(session_id)
        if not path.exists():
            return []
        return json.loads(path.read_text(encoding="utf-8")).get("items", [])

    def _save(self, session_id: str, items: list[dict]) -> None:
        out_dir = self._session_dir(session_id)
        out_dir.mkdir(parents=True, exist_ok=True)
        self._ann_path(session_id).write_text(
            json.dumps(
                {"session_id": session_id, "items": items},
                ensure_ascii=False,
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        self._write_txt(session_id, items)

    def _write_txt(self, session_id: str, items: list[dict]) -> None:
        out_dir = self._session_dir(session_id)
        for old in out_dir.glob("frame_*.txt"):
            old.unlink()

        grouped: dict[str, list[dict]] = {}
        for item in items:
            grouped.setdefault(item["frame"], []).append(item)

        for frame, boxes in grouped.items():
            stem = Path(frame).stem
            lines = [
                f"{box['label_id']} {box['x']:.6f} {box['y']:.6f} {box['w']:.6f} {box['h']:.6f}"
                for box in boxes
            ]
            (out_dir / f"{stem}.txt").write_text(
                "\n".join(lines) + ("\n" if lines else ""),
                encoding="utf-8",
            )

    def _reuse_or_create_label(self, label_id: int | None, name: str | None):
        existing = self.labels.list_labels().labels

        if label_id is not None:
            for item in existing:
                if item.id == label_id:
                    return item
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                detail=f"라벨 id={label_id} 를 찾을 수 없습니다.",
            )

        if name:
            cleaned = name.strip()
            for item in existing:
                if item.name.lower() == cleaned.lower():
                    return item
            return self.labels.create_label(YoloLabelCreateRequest(name=cleaned))

        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="label_id 또는 name이 필요합니다.",
        )

    def list_annotations(
        self,
        session_id: str,
        frame: str | None = None,
    ) -> YoloBoxListResponse:
        items = self._load(session_id)
        if frame:
            items = [item for item in items if item["frame"] == frame]
        return YoloBoxListResponse(
            session_id=session_id,
            frame=frame,
            items=[YoloBoxAnnotation(**item) for item in items],
        )

    def create_annotation(self, body: YoloBoxCreateRequest) -> YoloBoxAnnotation:
        self._ensure_frame(body.session_id, body.frame)
        label = self._reuse_or_create_label(body.label_id, body.name)
        created = {
            "id": uuid.uuid4().hex,
            "session_id": body.session_id,
            "frame": body.frame,
            "label_id": label.id,
            "label_name": label.name,
            "x": clamp01(body.x),
            "y": clamp01(body.y),
            "w": clamp01(body.w),
            "h": clamp01(body.h),
        }
        items = self._load(body.session_id)
        items.append(created)
        self._save(body.session_id, items)
        return YoloBoxAnnotation(**created)

    def update_annotation(
        self,
        session_id: str,
        annotation_id: str,
        body: YoloBoxUpdateRequest,
    ) -> YoloBoxAnnotation:
        items = self._load(session_id)
        idx = next((i for i, item in enumerate(items) if item["id"] == annotation_id), None)
        if idx is None:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                detail=f"박스 id={annotation_id} 를 찾을 수 없습니다.",
            )

        current = items[idx]
        if body.label_id is not None or body.name:
            label = self._reuse_or_create_label(body.label_id, body.name)
            current["label_id"] = label.id
            current["label_name"] = label.name

        for key in ("x", "y", "w", "h"):
            value = getattr(body, key)
            if value is not None:
                current[key] = clamp01(value)

        items[idx] = current
        self._save(session_id, items)
        return YoloBoxAnnotation(**current)

    def delete_annotation(self, session_id: str, annotation_id: str) -> None:
        items = self._load(session_id)
        filtered = [item for item in items if item["id"] != annotation_id]
        if len(filtered) == len(items):
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                detail=f"박스 id={annotation_id} 를 찾을 수 없습니다.",
            )
        self._save(session_id, filtered)