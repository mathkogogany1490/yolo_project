from pydantic import BaseModel, Field


class YoloDetectionItem(BaseModel):
    label_id: int
    label_name: str
    confidence: float
    x: float
    y: float
    w: float
    h: float


class YoloPredictResponse(BaseModel):
    detections: list[YoloDetectionItem]
    checkpoint_path: str
    device: str


class YoloVideoPredictSummaryItem(BaseModel):
    label_name: str
    count: int
    max_confidence: float


class YoloVideoFramePrediction(BaseModel):
    frame_index: int
    time_sec: float
    detections: list[YoloDetectionItem]


class YoloVideoPredictResponse(BaseModel):
    job_id: str
    source_filename: str
    output_filename: str
    total_frames: int
    processed_frames: int
    fps: float
    duration_sec: float
    summary: list[YoloVideoPredictSummaryItem]
    frames: list[YoloVideoFramePrediction]
    checkpoint_path: str
    device: str