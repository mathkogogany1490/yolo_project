from pathlib import Path
import argparse
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from ultralytics import YOLO

from app.service.yolo_train_service import resolve_yolo_device

CHECKPOINT = BACKEND_ROOT / "yolo" / "checkpoints" / "best.pt"
RUNS_ROOT = BACKEND_ROOT / "yolo" / "runs" / "predict"


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--conf", type=float, default=0.25)
    parser.add_argument("--device", default="auto", choices=["auto", "cuda", "cpu"])
    args = parser.parse_args()

    if not CHECKPOINT.exists():
        raise SystemExit("best.pt가 없습니다. 화면에서 먼저 훈련해 주세요.")

    device = resolve_yolo_device(args.device)
    RUNS_ROOT.mkdir(parents=True, exist_ok=True)
    model = YOLO(str(CHECKPOINT))
    model.predict(
        source=str(args.source),
        conf=args.conf,
        device=device,
        save=True,
        project=str(RUNS_ROOT),
        name="cli",
        exist_ok=True,
    )
    print("checkpoint:", CHECKPOINT)
    print("device:", device)