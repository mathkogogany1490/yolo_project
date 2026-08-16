from pathlib import Path
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile, status

from app.schema.yolo_frame import (
    YoloFrameExtractResponse,
    YoloFrameItem,
    YoloFrameSessionResponse,
    YoloSessionItem,
    YoloSessionListResponse,
)
from yolo.scripts.extract_frames import extract_frames

BACKEND_ROOT = Path(__file__).resolve().parents[2]
FRAMES_ROOT = BACKEND_ROOT / "yolo" / "workspace" / "frames"
VIDEO_EXTS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".m4v"}


class YoloFrameService:
    def _session_id(self) -> str:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        return f"{stamp}_{uuid.uuid4().hex[:8]}"

    async def extract_upload(
        self,
        file: UploadFile,
        frame_count: int,
    ) -> YoloFrameExtractResponse:
        if not file.filename:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="영상 파일명이 필요합니다.")

        suffix = Path(file.filename).suffix.lower()
        if not suffix and (file.content_type or "").startswith("video/"):
            suffix = ".mp4"
        if suffix not in VIDEO_EXTS:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="지원하지 않는 영상 형식입니다.")

        session_id = self._session_id()
        session_dir = FRAMES_ROOT / session_id
        session_dir.mkdir(parents=True, exist_ok=True)
        video_path = session_dir / f"source{suffix}"

        size = 0
        with video_path.open("wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                out.write(chunk)
        if size == 0:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="빈 파일입니다.")

        print(f"[yolo] extract start session={session_id} size={size} frames={frame_count}")
        try:
            total, saved = extract_frames(video_path, session_dir, frame_count)
        except Exception as exc:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail=f"프레임 추출에 실패했습니다: {exc}",
            ) from exc

        if not saved:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="프레임을 하나도 추출하지 못했습니다.",
            )
        print(f"[yolo] extract done session={session_id} saved={len(saved)} total={total}")

        frames = [
            YoloFrameItem(
                index=i,
                filename=path.name,
                path=path.relative_to(BACKEND_ROOT).as_posix(),
            )
            for i, path in enumerate(saved, start=1)
        ]
        return YoloFrameExtractResponse(
            session_id=session_id,
            frame_count=len(frames),
            total_video_frames=total,
            frames=frames,
        )

    def list_session(self, session_id: str) -> YoloFrameSessionResponse:
        session_dir = FRAMES_ROOT / session_id
        if not session_dir.is_dir():
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                detail=f"세션을 찾을 수 없습니다: {session_id}",
            )
        saved = sorted(session_dir.glob("frame_*.jpg"))
        frames = [
            YoloFrameItem(
                index=i,
                filename=path.name,
                path=path.relative_to(BACKEND_ROOT).as_posix(),
            )
            for i, path in enumerate(saved, start=1)
        ]
        return YoloFrameSessionResponse(session_id=session_id, frames=frames)

    def list_sessions(self) -> YoloSessionListResponse:
        if not FRAMES_ROOT.is_dir():
            return YoloSessionListResponse(sessions=[])
        sessions: list[YoloSessionItem] = []
        for session_dir in sorted(FRAMES_ROOT.iterdir(), reverse=True):
            if not session_dir.is_dir():
                continue
            frame_count = len(list(session_dir.glob("frame_*.jpg")))
            if frame_count:
                sessions.append(
                    YoloSessionItem(session_id=session_dir.name, frame_count=frame_count)
                )
        return YoloSessionListResponse(sessions=sessions)

    def get_frame_file(self, session_id: str, filename: str) -> Path:
        session_dir = (FRAMES_ROOT / session_id).resolve()
        path = (session_dir / filename).resolve()
        try:
            path.relative_to(session_dir)
        except ValueError as exc:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="잘못된 경로입니다.",
            ) from exc
        if not path.is_file():
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                detail="프레임을 찾을 수 없습니다.",
            )
        return path