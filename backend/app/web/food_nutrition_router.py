from fastapi import APIRouter, Depends, File, UploadFile

from app.schema.food_nutrition import NutritionAnalyzeResponse
from app.service.food_nutrition_service import FoodNutritionService

router = APIRouter(prefix="/nutrition", tags=["nutrition"])

_service: FoodNutritionService | None = None


def get_food_nutrition_service() -> FoodNutritionService:
    global _service
    if _service is None:
        _service = FoodNutritionService()
    return _service


@router.post("/analyze", response_model=NutritionAnalyzeResponse)
async def analyze(
    file: UploadFile = File(...),
    service: FoodNutritionService = Depends(get_food_nutrition_service),
) -> NutritionAnalyzeResponse:
    image_bytes = await file.read()
    return service.analyze(image_bytes)