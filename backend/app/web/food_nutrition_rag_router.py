from fastapi import APIRouter, Depends, File, UploadFile

from app.schema.food_nutrition_rag import NutritionRagAnalyzeResponse
from app.service.food_nutrition_rag_service import FoodNutritionRagService

router = APIRouter(prefix="/nutrition/rag", tags=["nutrition-rag"])

_service: FoodNutritionRagService | None = None


def get_food_nutrition_rag_service() -> FoodNutritionRagService:
    global _service
    if _service is None:
        _service = FoodNutritionRagService()
    return _service


@router.post("/analyze", response_model=NutritionRagAnalyzeResponse)
async def analyze(
    file: UploadFile = File(...),
    service: FoodNutritionRagService = Depends(get_food_nutrition_rag_service),
) -> NutritionRagAnalyzeResponse:
    image_bytes = await file.read()
    return service.analyze(image_bytes)