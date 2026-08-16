from pydantic import BaseModel, Field


class YoloTrainRequest(BaseModel):
    session_ids: list[str] | None = None
    epochs: int = Field(default=50, ge=1, le=500)
    imgsz: int = Field(default=640, ge=320, le=1280)
    batch: int = Field(default=8, ge=1, le=64)
    val_ratio: float = Field(default=0.2, gt=0, lt=1)
    device: str = Field(default="auto")


class YoloTrainResponse(BaseModel):
    job_id: str
    dataset_path: str
    data_yaml: str
    train_images: int
    val_images: int
    epochs: int
    device: str
    checkpoint_path: str
    run_dir: str