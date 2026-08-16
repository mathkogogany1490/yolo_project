from pathlib import Path
import json

from fastapi import HTTPException, status

from app.schema.yolo_label import (
    YoloLabelCreateRequest,
    YoloLabelItem,
    YoloLabelUpdateRequest,
    YoloLabelsResponse,
)

BACKEND_ROOT = Path(__file__).resolve().parents[2]
LABELS_PATH = BACKEND_ROOT / "yolo" / "dataset" / "labels.json"
YAML_PATH = BACKEND_ROOT / "yolo" / "dataset" / "data.yaml"


class YoloLabelService:
    def _load(self) -> list[dict]:
        if not LABELS_PATH.exists():
            return []
        payload = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
        return payload.get("labels", [])

    def _save(self, labels: list[dict]) -> None:
        LABELS_PATH.parent.mkdir(parents=True, exist_ok=True)
        LABELS_PATH.write_text(
            json.dumps({"labels": labels}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        self._sync_data_yaml(labels)

    def _sync_data_yaml(self, labels: list[dict]) -> None:
        ordered = sorted(labels, key=lambda x: int(x["id"]))
        names = "\n".join(
            f"  {idx}: {item['name']}" for idx, item in enumerate(ordered)
        ) or "  0: object"
        YAML_PATH.parent.mkdir(parents=True, exist_ok=True)
        YAML_PATH.write_text(
            "path: yolo/dataset\n"
            "train: images/train\n"
            "val: images/val\n\n"
            f"names:\n{names}\n",
            encoding="utf-8",
        )

    def list_labels(self) -> YoloLabelsResponse:
        return YoloLabelsResponse(
            labels=[YoloLabelItem(**item) for item in self._load()]
        )

    def create_label(self, body: YoloLabelCreateRequest) -> YoloLabelItem:
        name = body.name.strip()
        labels = self._load()
        if any(item["name"].lower() == name.lower() for item in labels):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=f"이미 있는 라벨입니다: {name}",
            )
        next_id = max((int(item["id"]) for item in labels), default=-1) + 1
        created = {"id": next_id, "name": name}
        labels.append(created)
        self._save(labels)
        return YoloLabelItem(**created)

    def update_label(self, label_id: int, body: YoloLabelUpdateRequest) -> YoloLabelItem:
        name = body.name.strip()
        labels = self._load()
        idx = next((i for i, item in enumerate(labels) if int(item["id"]) == label_id), None)
        if idx is None:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                detail=f"라벨 id={label_id} 를 찾을 수 없습니다.",
            )
        if any(
            int(item["id"]) != label_id and item["name"].lower() == name.lower()
            for item in labels
        ):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=f"이미 있는 라벨입니다: {name}",
            )
        labels[idx]["name"] = name
        self._save(labels)
        return YoloLabelItem(**labels[idx])

    def delete_label(self, label_id: int) -> None:
        labels = self._load()
        filtered = [item for item in labels if int(item["id"]) != label_id]
        if len(filtered) == len(labels):
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                detail=f"라벨 id={label_id} 를 찾을 수 없습니다.",
            )
        self._save(filtered)