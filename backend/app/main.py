from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.model.user import User  # noqa: F401
from app.lecture_rag.web import register_lecture_routers
from app.web.auth_router import router as auth_router
from app.web.food_nutrition_router import router as nutrition_router
from app.web.food_nutrition_rag_router import router as nutrition_rag_router
from app.web.yolo_router import router as yolo_router





@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="YOLO Auth API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8088",
        "http://127.0.0.1:8088",
        "http://localhost",
        "http://127.0.0.1",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(nutrition_router)
app.include_router(nutrition_rag_router)
app.include_router(yolo_router)
register_lecture_routers(app)


@app.get("/health")
def health():
    return {"status": "ok"}