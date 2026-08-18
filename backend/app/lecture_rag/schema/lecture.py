from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from .scene import SceneId, SceneItem


class TurnRequest(BaseModel):
    text: str = Field(min_length=1)
    current_scene: SceneId | None = None
    from_menu: bool = False


class TurnResponse(BaseModel):
    scene: SceneId
    title: str
    explanation: str
    hint: str
    heard: str = ""
    chart: dict[str, Any]
    charts: list[dict[str, Any]] = Field(default_factory=list)
    scenes: list[SceneItem]
    openai: bool
    explained_variance: list[float]
    source_name: str = ""
