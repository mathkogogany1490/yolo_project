from pydantic import BaseModel, Field


class YoloBoxAnnotation(BaseModel):
    id: str
    session_id: str
    frame: str
    label_id: int
    label_name: str
    x: float
    y: float
    w: float
    h: float


class YoloBoxCreateRequest(BaseModel):
    session_id: str
    frame: str
    label_id: int | None = None
    name: str | None = None
    x: float
    y: float
    w: float
    h: float


class YoloBoxUpdateRequest(BaseModel):
    label_id: int | None = None
    name: str | None = None
    x: float | None = None
    y: float | None = None
    w: float | None = None
    h: float | None = None


class YoloBoxListResponse(BaseModel):
    session_id: str
    frame: str | None = None
    items: list[YoloBoxAnnotation]