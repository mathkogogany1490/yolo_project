from __future__ import annotations

from typing import Any, Literal

import pandas as pd


def make_matrix_chart(
    df: pd.DataFrame,
    columns: list[str],
    kind: Literal["covariance", "correlation"],
) -> dict[str, Any]:
    usable = [col for col in columns if col in df.columns]
    if len(usable) < 2:
        return {"type": "none"}
    work = df[usable].dropna()
    if len(work) < 2:
        return {"type": "none"}
    matrix = work.corr() if kind == "correlation" else work.cov()
    title = "변수 간 상관계수" if kind == "correlation" else "변수 간 공분산"
    values = [[round(float(value), 3) for value in row] for row in matrix.to_numpy()]
    return {
        "type": "heatmap",
        "title": title,
        "xLabel": "변수",
        "yLabel": "변수",
        "labels": list(matrix.columns),
        "values": values,
        "scale": kind,
    }
