from fastapi import HTTPException, status
from redis import Redis
from sqlalchemy.orm import Session

from app.config import settings
from app.repository.user_repository import UserRepository
from app.schema.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)


class AuthService:
    def __init__(self, db: Session, redis_client: Redis):
        self.users = UserRepository(db)
        self.redis = redis_client

    def register(self, payload: RegisterRequest) -> UserResponse:
        if self.users.get_by_email(payload.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 등록된 이메일입니다.",
            )

        user = self.users.create(
            email=payload.email,
            password_hash=hash_password(payload.password),
        )
        return UserResponse.model_validate(user)

    def login(self, payload: LoginRequest) -> TokenResponse:
        user = self.users.get_by_email(payload.email)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            )

        subject = str(user.id)
        access_token = create_access_token(subject=subject, extra={"email": user.email})
        refresh_token = create_refresh_token(subject=subject, extra={"email": user.email})

        ttl_seconds = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        self.redis.setex(
            name=f"refresh_token:{user.id}",
            time=ttl_seconds,
            value=refresh_token,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )