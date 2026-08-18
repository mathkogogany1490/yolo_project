from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from .scene import SceneId, SceneItem


class DatasetUpdate(BaseModel):
    columns: list[str] | None = None


class DatasetInfo(BaseModel):
    source_name: str
    columns: list[str]
    numeric_columns: list[str]
    selected_columns: list[str]
    n_rows: int
    preview: list[dict[str, Any]]
    pca_ready: bool
    explained_variance: list[float]
    openai: bool
    current_scene: SceneId
    scenes: list[SceneItem]
