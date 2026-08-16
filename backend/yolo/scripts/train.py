from pathlib import Path
import argparse
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.schema.yolo_train import YoloTrainRequest
from app.service.yolo_train_service import YoloTrainService


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--sessions", nargs="*")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--device", default="auto", choices=["auto", "cuda", "cpu"])
    args = parser.parse_args()

    result = YoloTrainService().train(
        YoloTrainRequest(
            session_ids=args.sessions or None,
            epochs=args.epochs,
            device=args.device,
        )
    )
    print(result.model_dump_json(indent=2))