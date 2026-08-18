from fastapi import APIRouter, File, HTTPException, UploadFile

from ..schema.dataset import DatasetInfo, DatasetUpdate
from ..service import dataset as dataset_service

router = APIRouter(prefix="/lecture/dataset", tags=["lecture-dataset"])


@router.get("", response_model=DatasetInfo)
def get_dataset() -> DatasetInfo:
    return dataset_service.get_dataset_info()


@router.post("/sample", response_model=DatasetInfo)
def reset_sample() -> DatasetInfo:
    return dataset_service.reset_sample()


@router.post("/upload", response_model=DatasetInfo)
async def upload_dataset(file: UploadFile = File(...)) -> DatasetInfo:
    raw = await file.read()
    try:
        return dataset_service.upload_dataset(raw, file.filename or "upload.csv")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/columns", response_model=DatasetInfo)
def set_columns(body: DatasetUpdate) -> DatasetInfo:
    try:
        return dataset_service.set_columns(body.columns)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
