from fastapi import APIRouter
import asyncio

from ..schema.lecture import TurnRequest, TurnResponse
from ..service import lecture as lecture_service

router = APIRouter(prefix="/lecture", tags=["lecture"])


@router.get("/state", response_model=TurnResponse)
async def lecture_state() -> TurnResponse:
    return await asyncio.to_thread(lecture_service.get_lecture_state)


@router.post("/turn", response_model=TurnResponse)
async def lecture_turn(body: TurnRequest) -> TurnResponse:
    return await asyncio.to_thread(
        lecture_service.process_turn,
        body.text,
        body.current_scene,
        body.from_menu,
    )
