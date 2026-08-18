from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.datasets import load_iris

from .data import iris_species_label


def iris_bullet_items() -> list[str]:
    bundle = load_iris()
    labels = " · ".join(iris_species_label(str(name)) for name in bundle.target_names)
    return [
        "독립변수(속성) · 꽃받침길이(sepal length) · 꽃받침너비(sepal width) · "
        "꽃잎길이(petal length) ·\n꽃잎너비(petal width) — 단위 cm, 숫자 4개",
        f"라벨(종속변수) · 품종 — {labels}",
        "관측치 · 총 150개 (품종별 50개씩 균등)",
        "PCA 목적 · 4차원 측정값을 적은 축으로 요약해 품종 패턴을 봅니다",
    ]


def iris_explanation() -> str:
    return ""


def iris_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "Iris(붓꽃) 데이터",
            "variant": "iris",
            "items": iris_bullet_items(),
        },
        {"type": "table", "kind": "full", "title": "원본 데이터 (150행)"},
        {"type": "table", "kind": "counts", "column": "품종", "title": "품종별 관측치 개수"},
    ]


def make_iris_label_counts_table(df: pd.DataFrame) -> dict[str, Any]:
    if "품종" not in df.columns:
        return {"type": "none"}
    bundle = load_iris()
    rows = [
        [iris_species_label(str(name)), int((df["품종"] == iris_species_label(str(name))).sum())]
        for name in bundle.target_names
    ]
    rows.append(["합계", int(len(df))])
    return {
        "type": "table",
        "title": "품종별 관측치 개수",
        "columns": ["품종(라벨)", "개수"],
        "rows": rows,
    }


def make_iris_full_table(df: pd.DataFrame) -> dict[str, Any]:
    if df.empty:
        return {"type": "none"}
    preview = df.copy()
    for col in preview.columns:
        if pd.api.types.is_numeric_dtype(preview[col]):
            preview[col] = preview[col].round(2)
    preview = preview.replace({np.nan: None})
    columns = [str(col) for col in preview.columns]
    rows = [[record[col] for col in preview.columns] for record in preview.to_dict(orient="records")]
    return {
        "type": "table",
        "title": "원본 데이터 (150행)",
        "columns": columns,
        "rows": rows,
    }
