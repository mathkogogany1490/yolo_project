from pydantic import BaseModel


class NutritionInfo(BaseModel):
    calories: float
    protein: float
    fat: float
    carbohydrates: float


class NutritionAnalyzeResponse(BaseModel):
    food: str
    confidence: float
    nutrition: NutritionInfo
    answer: str