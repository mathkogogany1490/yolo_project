from pathlib import Path
import json
import random
import shutil
import uuid
from datetime import datetime, timezone

import torch
from fastapi import HTTPException, status
from ultralytics import YOLO

from app.schema.yolo_train import YoloTrainRequest, YoloTrainResponse
from app.service.yolo_label_service import YoloLabelService

BACKEND_ROOT = Path(__file__).resolve().parents[2]
FRAMES_ROOT = BACKEND_ROOT / "yolo" / "workspace" / "frames"
LABELS_ROOT = BACKEND_ROOT / "yolo" / "workspace" / "labels"
DATASET_ROOT = BACKEND_ROOT / "yolo" / "dataset" / "runs"
RUNS_ROOT = BACKEND_ROOT / "yolo" / "runs"
BASE_WEIGHTS = BACKEND_ROOT / "yolo" / "checkpoints" / "yolov8n.pt"
CHECKPOINT = BACKEND_ROOT / "yolo" / "checkpoints" / "best.pt"


def resolve_yolo_device(name: str = "auto") -> str:
    if name == "cpu":
        print("CPU로 학습합니다.")
        return "cpu"

    if torch.cuda.is_available():
        print(f"GPU 사용: {torch.cuda.get_device_name(0)}")
        print(f"CUDA: {torch.version.cuda}")
        return "0"

    print("CUDA GPU를 찾지 못했습니다. CPU로 학습합니다.")
    return "cpu"


class YoloTrainService:
    def __init__(self) -> None:
        self.labels = YoloLabelService()
        DATASET_ROOT.mkdir(parents=True, exist_ok=True)
        RUNS_ROOT.mkdir(parents=True, exist_ok=True)
        CHECKPOINT.parent.mkdir(parents=True, exist_ok=True)

    def _discover_sessions(self) -> list[str]:
        if not LABELS_ROOT.is_dir():
            return []
        sessions = []
        for session_dir in sorted(LABELS_ROOT.iterdir()):
            if session_dir.is_dir() and any(session_dir.glob("frame_*.txt")):
                sessions.append(session_dir.name)
        return sessions

    def _collect_samples(self, session_ids: list[str]) -> list[tuple[Path, Path]]:
        samples = []
        for session_id in session_ids:
            frame_dir = FRAMES_ROOT / session_id
            label_dir = LABELS_ROOT / session_id
            if not frame_dir.is_dir() or not label_dir.is_dir():
                continue
            for image_path in sorted(frame_dir.glob("frame_*.jpg")):
                label_path = label_dir / f"{image_path.stem}.txt"
                if label_path.is_file() and label_path.stat().st_size > 0:
                    samples.append((image_path, label_path))
        return samples

    def _class_map(self) -> tuple[dict[int, int], list[str]]:
        labels = sorted(self.labels.list_labels().labels, key=lambda x: x.id)
        if not labels:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="labels.json에 클래스가 없습니다.",
            )
        id_map = {item.id: idx for idx, item in enumerate(labels)}
        names = [item.name for item in labels]
        return id_map, names

    def _remap_txt(self, src: Path, dst: Path, id_map: dict[int, int]) -> None:
        lines = []
        for line in src.read_text(encoding="utf-8").splitlines():
            parts = line.split()
            if not parts:
                continue
            old_id = int(parts[0])
            if old_id not in id_map:
                continue
            parts[0] = str(id_map[old_id])
            lines.append(" ".join(parts))
        dst.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")

    def build_dataset(self, session_ids: list[str], val_ratio: float) -> tuple[Path, int, int]:
        samples = self._collect_samples(session_ids)
        if len(samples) < 2:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="학습용 이미지·라벨 쌍이 2개 이상 필요합니다.",
            )

        job_id = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S") + "_" + uuid.uuid4().hex[:8]
        dataset_dir = DATASET_ROOT / job_id
        for split in ("train", "val"):
            (dataset_dir / "images" / split).mkdir(parents=True, exist_ok=True)
            (dataset_dir / "labels" / split).mkdir(parents=True, exist_ok=True)

        id_map, names = self._class_map()
        random.shuffle(samples)
        val_count = max(1, int(len(samples) * val_ratio))
        train_images = 0
        val_images = 0

        for i, (image_path, label_path) in enumerate(samples):
            split = "val" if i < val_count else "train"
            stem = f"{image_path.parent.name}_{image_path.stem}"
            shutil.copy2(image_path, dataset_dir / "images" / split / f"{stem}.jpg")
            self._remap_txt(
                label_path,
                dataset_dir / "labels" / split / f"{stem}.txt",
                id_map,
            )
            if split == "val":
                val_images += 1
            else:
                train_images += 1

        names_block = "\n".join(f"  {i}: {n}" for i, n in enumerate(names))
        (dataset_dir / "data.yaml").write_text(
            f"path: {dataset_dir.resolve().as_posix()}\n"
            "train: images/train\n"
            "val: images/val\n\n"
            f"names:\n{names_block}\n",
            encoding="utf-8",
        )
        return dataset_dir, train_images, val_images

    def train(self, body: YoloTrainRequest) -> YoloTrainResponse:
        session_ids = body.session_ids or self._discover_sessions()
        if not session_ids:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="라벨이 있는 세션이 없습니다.",
            )
        CHECKPOINT.parent.mkdir(parents=True, exist_ok=True)
        weights = str(BASE_WEIGHTS) if BASE_WEIGHTS.exists() else "yolov8n.pt"

        device = resolve_yolo_device(body.device)
        dataset_dir, train_images, val_images = self.build_dataset(
            session_ids, body.val_ratio
        )
        job_id = dataset_dir.name
        run_dir = RUNS_ROOT / f"train-{job_id}"

        model = YOLO(weights)
        if not BASE_WEIGHTS.exists():
            downloaded = Path("yolov8n.pt")
            if downloaded.exists():
                shutil.copy2(downloaded, BASE_WEIGHTS)
        model.train(
            data=str(dataset_dir / "data.yaml"),
            epochs=body.epochs,
            imgsz=body.imgsz,
            batch=body.batch,
            device=device,
            amp=device != "cpu",
            project=str(RUNS_ROOT),
            name=f"train-{job_id}",
            exist_ok=True,
        )

        best_pt = run_dir / "weights" / "best.pt"
        if not best_pt.exists():
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="학습 후 best.pt를 찾지 못했습니다.",
            )
        shutil.copy2(best_pt, CHECKPOINT)

        rel = lambda p: p.relative_to(BACKEND_ROOT).as_posix()
        return YoloTrainResponse(
            job_id=job_id,
            dataset_path=rel(dataset_dir),
            data_yaml=rel(dataset_dir / "data.yaml"),
            train_images=train_images,
            val_images=val_images,
            epochs=body.epochs,
            device=device,
            checkpoint_path=rel(CHECKPOINT),
            run_dir=rel(run_dir),
        )