from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

from ..schema.scene import SceneId


def _round_points(xs: np.ndarray, ys: np.ndarray, labels: list[str] | None = None) -> list[dict[str, Any]]:
    points: list[dict[str, Any]] = []
    for i, (x, y) in enumerate(zip(xs, ys, strict=True)):
        item: dict[str, Any] = {"x": round(float(x), 3), "y": round(float(y), 3)}
        if labels is not None and i < len(labels):
            item["label"] = labels[i]
        points.append(item)
    return points


def compute_pca(df: pd.DataFrame, columns: list[str], n_components: int | None = None) -> dict[str, Any]:
    if len(columns) < 2:
        raise ValueError("PCA에는 숫자 열이 2개 이상 필요합니다.")

    work = df[columns].dropna()
    if len(work) < 3:
        raise ValueError("결측을 제외한 행이 너무 적습니다.")

    labels = (
        df.loc[work.index, df.columns[0]].astype(str).tolist()
        if df.columns[0] not in columns
        else [str(i + 1) for i in range(len(work))]
    )

    scaler = StandardScaler()
    scaled = scaler.fit_transform(work.to_numpy(dtype=float))
    max_components = min(len(columns), len(work))
    k = n_components or max_components
    k = max(2, min(k, max_components))

    pca = PCA(n_components=k)
    scores = pca.fit_transform(scaled)
    ratios = pca.explained_variance_ratio_
    loadings = pca.components_

    x_col, y_col = columns[0], columns[1]
    raw_x = work[x_col].to_numpy(dtype=float)
    raw_y = work[y_col].to_numpy(dtype=float)

    pc_names = [f"PC{i + 1}" for i in range(k)]
    loading_items: list[dict[str, Any]] = []
    for feature, col_loadings in zip(columns, loadings.T, strict=True):
        row: dict[str, Any] = {"name": feature}
        for name, value in zip(pc_names[:2], col_loadings[:2], strict=False):
            row[name] = round(float(value), 3)
        loading_items.append(row)

    score_scale = float(np.max(np.abs(scores[:, :2]))) or 1.0
    loading_scale = float(np.max(np.abs(loadings[:2, :]))) or 1.0
    arrow_scale = 0.85 * score_scale / loading_scale
    arrows = [
        {
            "name": feature,
            "x": round(float(loadings[0, i] * arrow_scale), 3),
            "y": round(float(loadings[1, i] * arrow_scale), 3),
        }
        for i, feature in enumerate(columns)
    ]

    charts: dict[str, dict[str, Any]] = {
        "raw_scatter": {
            "type": "scatter",
            "title": f"{x_col} · {y_col} 원본 분포",
            "xLabel": x_col,
            "yLabel": y_col,
            "points": _round_points(raw_x, raw_y, labels),
        },
        "scree": {
            "type": "bar",
            "title": "주성분별 설명 분산 비율",
            "xLabel": "주성분",
            "yLabel": "설명 분산 (%)",
            "items": [
                {"name": name, "value": round(float(ratio) * 100, 2)}
                for name, ratio in zip(pc_names, ratios, strict=True)
            ],
        },
        "pca_scatter": {
            "type": "scatter",
            "title": "표준화 후 PC1-PC2 좌표",
            "xLabel": f"PC1 ({ratios[0] * 100:.1f}%)",
            "yLabel": f"PC2 ({ratios[1] * 100:.1f}%)",
            "points": _round_points(scores[:, 0], scores[:, 1], labels),
        },
        "loadings": {
            "type": "grouped_bar",
            "title": "각 변수가 주성분에 기여하는 정도",
            "xLabel": "변수",
            "yLabel": "로딩",
            "series": [{"key": "PC1", "name": "PC1"}, {"key": "PC2", "name": "PC2"}],
            "items": loading_items,
        },
        "biplot": {
            "type": "biplot",
            "title": "관측치와 변수 방향을 함께 본 바이플롯",
            "xLabel": "PC1",
            "yLabel": "PC2",
            "points": _round_points(scores[:, 0], scores[:, 1], labels),
            "arrows": arrows,
        },
    }

    return {
        "columns": columns,
        "n_rows": int(len(work)),
        "explained_variance": [round(float(v) * 100, 2) for v in ratios],
        "cumulative_variance": [round(float(v) * 100, 2) for v in np.cumsum(ratios)],
        "charts": charts,
    }


def _row_labels(df: pd.DataFrame, work: pd.DataFrame, value_columns: list[str]) -> list[str]:
    if df.columns[0] not in value_columns:
        return df.loc[work.index, df.columns[0]].astype(str).tolist()
    return [str(i + 1) for i in range(len(work))]


def make_raw_scatter(df: pd.DataFrame, x_col: str, y_col: str) -> dict[str, Any]:
    if x_col not in df.columns or y_col not in df.columns:
        return {"type": "none"}
    work = df[[x_col, y_col]].dropna()
    if len(work) < 2:
        return {"type": "none"}
    labels = _row_labels(df, work, [x_col, y_col])
    return {
        "type": "scatter",
        "title": f"{x_col} · {y_col} 원본 분포",
        "xLabel": x_col,
        "yLabel": y_col,
        "points": _round_points(
            work[x_col].to_numpy(dtype=float),
            work[y_col].to_numpy(dtype=float),
            labels,
        ),
    }


def chart_for_scene(
    pca: dict[str, Any] | None,
    scene: SceneId,
    df: pd.DataFrame | None = None,
    x_column: str | None = None,
    y_column: str | None = None,
) -> dict[str, Any]:
    _ = df, x_column, y_column
    if not pca or scene not in pca["charts"]:
        return {"type": "none"}
    return pca["charts"][scene]
