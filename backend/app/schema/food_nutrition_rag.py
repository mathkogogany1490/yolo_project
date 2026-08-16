from pydantic import BaseModel

from app.schema.food_nutrition import NutritionInfo


class RagCandidate(BaseModel):
    food: str
    score: float
    seeds: NutritionInfo | None = None


class NutritionRagAnalyzeResponse(BaseModel):
    food: str
    score: float
    seeds: NutritionInfo
    answer: str
    candidates: list[RagCandidate]