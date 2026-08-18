from __future__ import annotations

from typing import Any

import pandas as pd

from ..schema.scene import SceneId
from .data import load_sample, numeric_columns
from .pca import compute_pca


class LectureStore:
    def __init__(self) -> None:
        self.df: pd.DataFrame = load_sample()
        self.source_name = "students.csv"
        self.columns: list[str] = numeric_columns(self.df)
        self.pca: dict[str, Any] | None = None
        self.current_scene: SceneId = "intro"
        self.rebuild_pca()

    def set_frame(self, df: pd.DataFrame, source_name: str, columns: list[str] | None = None) -> None:
        self.df = df
        self.source_name = source_name
        nums = numeric_columns(df)
        if columns:
            missing = [col for col in columns if col not in nums]
            if missing:
                raise ValueError(f"숫자 열이 아닙니다: {', '.join(missing)}")
            self.columns = columns
        else:
            self.columns = nums
        self.current_scene = "intro"
        self.rebuild_pca()

    def rebuild_pca(self) -> dict[str, Any]:
        self.pca = compute_pca(self.df, self.columns)
        return self.pca


store = LectureStore()
