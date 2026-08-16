from fastapi import APIRouter, Depends, File, Form, Query, UploadFile

from app.schema.yolo_annotation import (
    YoloBoxAnnotation,
    YoloBoxCreateRequest,
    YoloBoxListResponse,
    YoloBoxUpdateRequest,
)
from app.schema.yolo_frame import (
    YoloFrameExtractResponse,
    YoloFrameSessionResponse,
    YoloSessionListResponse,
)
from app.schema.yolo_label import (
    YoloLabelCreateRequest,
    YoloLabelItem,
    YoloLabelUpdateRequest,
    YoloLabelsResponse,
)
from app.service.yolo_annotation_service import YoloAnnotationService
from app.service.yolo_frame_service import YoloFrameService
from app.service.yolo_label_service import YoloLabelService
from app.schema.yolo_train import YoloTrainRequest, YoloTrainResponse
from app.service.yolo_train_service import YoloTrainService

from fastapi.responses import FileResponse
from app.schema.yolo_predict import YoloPredictResponse, YoloVideoPredictResponse
from app.service.yolo_predict_service import YoloPredictService


router = APIRouter(prefix="/yolo", tags=["yolo"])

_label_service: YoloLabelService | None = None
_frame_service: YoloFrameService | None = None
_ann_service: YoloAnnotationService | None = None
_train_service: YoloTrainService | None = None
_predict_service: YoloPredictService | None = None

def get_yolo_predict_service() -> YoloPredictService:
    global _predict_service
    if _predict_service is None:
        _predict_service = YoloPredictService()
    return _predict_service

def get_yolo_label_service() -> YoloLabelService:
    global _label_service
    if _label_service is None:
        _label_service = YoloLabelService()
    return _label_service


def get_yolo_train_service() -> YoloTrainService:
    global _train_service
    if _train_service is None:
        _train_service = YoloTrainService()
    return _train_service

def get_yolo_frame_service() -> YoloFrameService:
    global _frame_service
    if _frame_service is None:
        _frame_service = YoloFrameService()
    return _frame_service


def get_yolo_annotation_service() -> YoloAnnotationService:
    global _ann_service
    if _ann_service is None:
        _ann_service = YoloAnnotationService()
    return _ann_service


@router.post("/predict", response_model=YoloPredictResponse)
async def predict_image(
    file: UploadFile = File(...),
    conf: float = Form(0.25),
    device: str = Form("auto"),
    service: YoloPredictService = Depends(get_yolo_predict_service),
):
    return await service.predict_image(file, conf=conf, device=device)


@router.post("/predict/video", response_model=YoloVideoPredictResponse)
async def predict_video(
    file: UploadFile = File(...),
    conf: float = Form(0.25),
    device: str = Form("auto"),
    service: YoloPredictService = Depends(get_yolo_predict_service),
):
    return await service.predict_video(file, conf=conf, device=device)


@router.get("/predict/video/{job_id}/file")
def get_predict_video(
    job_id: str,
    service: YoloPredictService = Depends(get_yolo_predict_service),
):
    path = service.get_video_file(job_id)
    return FileResponse(path, media_type="video/mp4", filename=path.name)


@router.post("/train", response_model=YoloTrainResponse)
def train_yolo(
    body: YoloTrainRequest,
    service: YoloTrainService = Depends(get_yolo_train_service),
):
    return service.train(body)



@router.get("/labels", response_model=YoloLabelsResponse)
def list_labels(service: YoloLabelService = Depends(get_yolo_label_service)):
    return service.list_labels()


@router.post("/labels", response_model=YoloLabelItem, status_code=201)
def create_label(
    body: YoloLabelCreateRequest,
    service: YoloLabelService = Depends(get_yolo_label_service),
):
    return service.create_label(body)


@router.put("/labels/{label_id}", response_model=YoloLabelItem)
def update_label(
    label_id: int,
    body: YoloLabelUpdateRequest,
    service: YoloLabelService = Depends(get_yolo_label_service),
):
    return service.update_label(label_id, body)


@router.delete("/labels/{label_id}", status_code=204)
def delete_label(
    label_id: int,
    service: YoloLabelService = Depends(get_yolo_label_service),
):
    service.delete_label(label_id)


@router.get("/sessions", response_model=YoloSessionListResponse)
def list_sessions(service: YoloFrameService = Depends(get_yolo_frame_service)):
    return service.list_sessions()


@router.post("/frames/extract", response_model=YoloFrameExtractResponse)
async def extract_frames_api(
    file: UploadFile = File(...),
    frame_count: int = Form(..., ge=1, le=500),
    service: YoloFrameService = Depends(get_yolo_frame_service),
):
    return await service.extract_upload(file, frame_count)


@router.get("/frames/{session_id}", response_model=YoloFrameSessionResponse)
def list_frames(
    session_id: str,
    service: YoloFrameService = Depends(get_yolo_frame_service),
):
    return service.list_session(session_id)


@router.get("/frames/{session_id}/file/{filename}")
def get_frame_file(
    session_id: str,
    filename: str,
    service: YoloFrameService = Depends(get_yolo_frame_service),
):
    path = service.get_frame_file(session_id, filename)
    suffix = path.suffix.lower()
    media = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo",
        ".mkv": "video/x-matroska",
        ".m4v": "video/mp4",
    }.get(suffix, "application/octet-stream")
    return FileResponse(path, media_type=media, filename=path.name)


@router.get("/annotations/{session_id}", response_model=YoloBoxListResponse)
def list_annotations(
    session_id: str,
    frame: str | None = Query(default=None),
    service: YoloAnnotationService = Depends(get_yolo_annotation_service),
):
    return service.list_annotations(session_id, frame)


@router.post("/annotations", response_model=YoloBoxAnnotation, status_code=201)
def create_annotation(
    body: YoloBoxCreateRequest,
    service: YoloAnnotationService = Depends(get_yolo_annotation_service),
):
    return service.create_annotation(body)


@router.put("/annotations/{session_id}/{annotation_id}", response_model=YoloBoxAnnotation)
def update_annotation(
    session_id: str,
    annotation_id: str,
    body: YoloBoxUpdateRequest,
    service: YoloAnnotationService = Depends(get_yolo_annotation_service),
):
    return service.update_annotation(session_id, annotation_id, body)


@router.delete("/annotations/{session_id}/{annotation_id}", status_code=204)
def delete_annotation(
    session_id: str,
    annotation_id: str,
    service: YoloAnnotationService = Depends(get_yolo_annotation_service),
):
    service.delete_annotation(session_id, annotation_id)