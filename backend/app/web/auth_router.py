from fastapi import APIRouter, Depends
from redis import Redis
from sqlalchemy.orm import Session

from app.database import get_db
from app.redis_client import get_redis
from app.schema.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.service.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(
    db: Session = Depends(get_db),
    redis_client: Redis = Depends(get_redis),
) -> AuthService:
    return AuthService(db=db, redis_client=redis_client)


@router.post("/register", response_model=UserResponse, status_code=201)
def register(
    payload: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    return auth_service.register(payload)


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return auth_service.login(payload)