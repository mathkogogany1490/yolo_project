from fastapi import APIRouter

from ..schema.lecture import TurnRequest, TurnResponse
from ..service import lecture as lecture_service

router = APIRouter(prefix="/lecture", tags=["lecture"])


@router.get("/state", response_model=TurnResponse)
def lecture_state() -> TurnResponse:
    return lecture_service.get_lecture_state()


@router.post("/turn", response_model=TurnResponse)
def lecture_turn(body: TurnRequest) -> TurnResponse:
    return lecture_service.process_turn(body.text, body.current_scene, from_menu=body.from_menu)
