from fastapi import FastAPI

from .dataset import router as dataset_router
from .lecture import router as lecture_router


def register_lecture_routers(app: FastAPI) -> None:
    app.include_router(lecture_router)
    app.include_router(dataset_router)
