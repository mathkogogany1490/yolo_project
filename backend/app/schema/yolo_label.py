from pydantic import BaseModel, Field


class YoloLabelItem(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=64)


class YoloLabelsResponse(BaseModel):
    labels: list[YoloLabelItem]


class YoloLabelCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class YoloLabelUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=64)