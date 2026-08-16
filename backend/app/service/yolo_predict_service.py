from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone
from io import BytesIO
import json
import shutil
import subprocess
import uuid

import cv2
from fastapi import HTTPException, UploadFile, status
from PIL import Image
from ultralytics import YOLO

from app.schema.yolo_predict import (
    YoloDetectionItem,
    YoloPredictResponse,
    YoloVideoFramePrediction,
    YoloVideoPredictResponse,
    YoloVideoPredictSummaryItem,
)
from app.service.yolo_train_service import resolve_yolo_device

BACKEND_ROOT = Path(__file__).resolve().parents[2]
CHECKPOINT = BACKEND_ROOT / "yolo" / "checkpoints" / "best.pt"
RUNS_ROOT = BACKEND_ROOT / "yolo" / "runs" / "predict"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
VIDEO_EXTS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".m4v"}


def _rel(path: Path) -> str:
    return path.relative_to(BACKEND_ROOT).as_posix()


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


class YoloPredictService:
    def __init__(self) -> None:
        RUNS_ROOT.mkdir(parents=True, exist_ok=True)
        self._model: YOLO | None = None
        self._mtime: float | None = None

    def _get_model(self) -> YOLO:
        if not CHECKPOINT.exists():
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="best.pt가 없습니다. 화면에서 먼저 훈련해 주세요.",
            )
        mtime = CHECKPOINT.stat().st_mtime
        if self._model is None or self._mtime != mtime:
            self._model = YOLO(str(CHECKPOINT))
            self._mtime = mtime
        return self._model

    def _names(self, model: YOLO) -> dict[int, str]:
        if isinstance(model.names, dict):
            return model.names
        return dict(enumerate(model.names))

    def _parse_boxes(self, result, names: dict[int, str]) -> list[YoloDetectionItem]:
        detections = []
        if result.boxes is None:
            return detections
        for box in result.boxes:
            cls_id = int(box.cls.item())
            x, y, w, h = box.xywhn[0].tolist()
            detections.append(
                YoloDetectionItem(
                    label_id=cls_id,
                    label_name=names.get(cls_id, str(cls_id)),
                    confidence=_clamp01(float(box.conf.item())),
                    x=_clamp01(x),
                    y=_clamp01(y),
                    w=_clamp01(w),
                    h=_clamp01(h),
                )
            )
        return detections

    def _transcode_h264(self, src: Path) -> Path:
        ffmpeg = shutil.which("ffmpeg")
        if not ffmpeg:
            return src
        dst = src.with_name(f"{src.stem}_h264.mp4")
        done = subprocess.run(
            [
                ffmpeg, "-y", "-i", str(src),
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
                "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
                str(dst),
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        if done.returncode == 0 and dst.is_file() and dst.stat().st_size > 0:
            return dst
        return src

    async def predict_image(
        self,
        file: UploadFile,
        conf: float = 0.25,
        device: str = "auto",
    ) -> YoloPredictResponse:
        raw = await file.read()
        if not raw:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="빈 파일입니다.")
        try:
            image = Image.open(BytesIO(raw)).convert("RGB")
        except Exception as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="이미지를 읽을 수 없습니다.") from exc

        tmp = RUNS_ROOT / f"{uuid.uuid4().hex}.jpg"
        image.save(tmp)
        device_id = resolve_yolo_device(device)
        try:
            model = self._get_model()
            names = self._names(model)
            results = model.predict(
                source=str(tmp),
                conf=conf,
                device=device_id,
                verbose=False,
            )
            detections = []
            for result in results:
                detections.extend(self._parse_boxes(result, names))
        finally:
            tmp.unlink(missing_ok=True)

        return YoloPredictResponse(
            detections=detections,
            checkpoint_path=_rel(CHECKPOINT),
            device=device_id,
        )

    async def predict_video(
        self,
        file: UploadFile,
        conf: float = 0.25,
        device: str = "auto",
    ) -> YoloVideoPredictResponse:
        if not file.filename:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="영상 파일명이 필요합니다.")
        suffix = Path(file.filename).suffix.lower()
        if suffix not in VIDEO_EXTS:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="지원하지 않는 영상 형식입니다.")

        raw = await file.read()
        if not raw:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="빈 파일입니다.")

        job_id = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S") + "_" + uuid.uuid4().hex[:8]
        job_dir = RUNS_ROOT / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        source = job_dir / f"source{suffix}"
        source.write_bytes(raw)

        cap = cv2.VideoCapture(str(source))
        if not cap.isOpened():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="영상을 열 수 없습니다.")
        fps = float(cap.get(cv2.CAP_PROP_FPS) or 25) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        cap.release()

        device_id = resolve_yolo_device(device)
        model = self._get_model()
        names = self._names(model)
        boxed = job_dir / "boxed.mp4"
        writer = cv2.VideoWriter(
            str(boxed),
            cv2.VideoWriter_fourcc(*"mp4v"),
            fps,
            (width, height),
        )

        counts: dict[str, int] = defaultdict(int)
        max_conf: dict[str, float] = defaultdict(float)
        frames: list[YoloVideoFramePrediction] = []
        processed = 0

        try:
            for index, result in enumerate(
                model.predict(
                    source=str(source),
                    conf=conf,
                    device=device_id,
                    stream=True,
                    verbose=False,
                )
            ):
                processed += 1
                writer.write(result.plot())
                detections = self._parse_boxes(result, names)
                if not detections:
                    continue
                for item in detections:
                    counts[item.label_name] += 1
                    max_conf[item.label_name] = max(max_conf[item.label_name], item.confidence)
                frames.append(
                    YoloVideoFramePrediction(
                        frame_index=index,
                        time_sec=round(index / fps, 3),
                        detections=detections,
                    )
                )
        finally:
            writer.release()

        output = self._transcode_h264(boxed)
        (job_dir / "meta.json").write_text(
            json.dumps(
                {
                    "job_id": job_id,
                    "output_video_path": _rel(output),
                    "output_filename": output.name,
                },
                ensure_ascii=False,
                indent=2,
            ) + "\n",
            encoding="utf-8",
        )

        summary = [
            YoloVideoPredictSummaryItem(
                label_name=name,
                count=count,
                max_confidence=round(max_conf[name], 4),
            )
            for name, count in sorted(counts.items(), key=lambda x: (-x[1], x[0]))
        ]
        return YoloVideoPredictResponse(
            job_id=job_id,
            source_filename=file.filename,
            output_filename=output.name,
            total_frames=total_frames,
            processed_frames=processed,
            fps=round(fps, 3),
            duration_sec=round(total_frames / fps, 3) if fps else 0,
            summary=summary,
            frames=frames,
            checkpoint_path=_rel(CHECKPOINT),
            device=device_id,
        )

    def get_video_file(self, job_id: str) -> Path:
        meta = RUNS_ROOT / job_id / "meta.json"
        if not meta.exists():
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="예측 결과가 없습니다.")
        path = BACKEND_ROOT / json.loads(meta.read_text(encoding="utf-8"))["output_video_path"]
        if not path.is_file():
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="결과 영상이 없습니다.")
        return path