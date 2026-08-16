from pydantic import BaseModel


class YoloFrameItem(BaseModel):
    index: int
    filename: str
    path: str


class YoloSessionItem(BaseModel):
    session_id: str
    frame_count: int


class YoloSessionListResponse(BaseModel):
    sessions: list[YoloSessionItem]


class YoloFrameExtractResponse(BaseModel):
    session_id: str
    frame_count: int
    total_video_frames: int
    frames: list[YoloFrameItem]


class YoloFrameSessionResponse(BaseModel):
    session_id: str
    frames: list[YoloFrameItem]