from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

IRIS_FEATURES = ["꽃받침길이", "꽃받침너비", "꽃잎길이", "꽃잎너비"]


def _iris_minmax_cov_eigen(df: pd.DataFrame) -> dict[str, Any] | None:
    usable = [col for col in IRIS_FEATURES if col in df.columns]
    if len(usable) < 2:
        return None
    work = df[usable].dropna().astype(float)
    n_rows, n_cols = work.shape
    if n_rows < 3:
        return None

    mins = work.min()
    maxs = work.max()
    spans = (maxs - mins).replace(0, 1.0)
    normalized = (work - mins) / spans
    centered = normalized - normalized.mean()
    matrix_a = centered.to_numpy(dtype=float)
    cov = (matrix_a.T @ matrix_a) / (n_rows - 1)
    evals, evecs = np.linalg.eigh(cov)
    order = np.argsort(evals)[::-1]
    evals = evals[order]
    evecs = evecs[:, order]
    total = float(evals.sum()) or 1.0

    return {
        "features": usable,
        "n_rows": n_rows,
        "n_cols": n_cols,
        "cov": cov,
        "evals": evals,
        "evecs": evecs,
        "matrix_a": matrix_a,
        "index": work.index,
        "explained_ratio_percent": [round(float(v / total) * 100, 1) for v in evals],
    }


def iris_cov_eigen_bullet_items() -> list[str]:
    return [
        "Min-Max · z = (x − min) / (max − min) → 각 변수를 0~1로 맞춤",
        "A 행렬 · Min-Max 후 변수별 평균을 뺀 150×4 행렬",
        "공분산 · Σ = (1/(n−1)) × Aᵀ @ A  — 표를 행렬로 바꿔 행렬곱으로 계산",
        "고유값 λ · 각 주성분 축이 설명하는 정보량(분산)",
        "고유벡터 v · 각 변수에 부여되는 가중치(새 축의 방향)",
    ]


def iris_cov_eigen_explanation() -> str:
    return ""


def iris_cov_eigen_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "Min-Max · 공분산 · 고유값",
            "variant": "iris",
            "items": iris_cov_eigen_bullet_items(),
        },
        {"type": "iris_cov_heatmap"},
        {"type": "iris_eigen_table"},
    ]


def make_iris_cov_heatmap_chart(df: pd.DataFrame) -> dict[str, Any]:
    data = _iris_minmax_cov_eigen(df)
    if data is None:
        return {"type": "none"}

    labels = data["features"]
    values = [[round(float(value), 4) for value in row] for row in data["cov"]]
    n_rows = data["n_rows"]
    n_cols = data["n_cols"]

    return {
        "type": "heatmap",
        "title": "Min-Max 정규화 후 공분산 행렬 Σ",
        "xLabel": "변수",
        "yLabel": "변수",
        "labels": labels,
        "values": values,
        "scale": "covariance",
        "footnote": {
            "title": "행렬곱으로 공분산 계산",
            "formula": {
                "symbol": "Σ",
                "numerator": "Aᵀ @ A",
                "denominator": f"n − 1  (n={n_rows})",
            },
            "steps": [
                "① Min-Max: z = (x − min) / (max − min)",
                f"② A = [z₁ … z₄] − 평균  →  {n_rows}×{n_cols} 행렬",
                f"③ Σ = (1/{n_rows - 1}) × Aᵀ @ A  →  {n_cols}×{n_cols} 공분산",
                "④ np.linalg.eigh(Σ)로 고유값 λ, 고유벡터 v 계산",
            ],
        },
    }


def make_iris_eigen_table_chart(df: pd.DataFrame) -> dict[str, Any]:
    data = _iris_minmax_cov_eigen(df)
    if data is None:
        return {"type": "none"}

    features = data["features"]
    evals = data["evals"]
    evecs = data["evecs"]
    ratios = data["explained_ratio_percent"]
    n_pc = len(features)

    columns = ["항목", *[f"v{i + 1}" for i in range(n_pc)]]
    rows: list[list[Any]] = [
        ["고유값 λ", *[round(float(v), 4) for v in evals]],
        ["설명 비율 (%)", *ratios],
    ]
    for i, feature in enumerate(features):
        rows.append([f"{feature} 가중치", *[round(float(evecs[i, j]), 3) for j in range(n_pc)]])

    return {
        "type": "table",
        "title": "고유값(정보량) · 고유벡터(가중치)",
        "columns": columns,
        "rows": rows,
        "footnote": {
            "title": "해석",
            "formula": {
                "symbol": "λ",
                "numerator": "정보량",
                "denominator": "분산",
            },
            "steps": [
                "고유값 λ가 클수록 그 축이 데이터 변동을 많이 설명",
                "고유벡터 v의 각 성분 = 해당 변수의 가중치",
                "v₁ 방향 = 1번째 주성분(PC1), v₂ = PC2 …",
            ],
        },
    }


def iris_pca_2d_bullet_items() -> list[str]:
    return [
        "정보량이 큰 두 축 · λ1, λ2에 대응하는 고유벡터 v1, v2를 가중치로 사용",
        "가중치 행렬 W · W = [v1 v2]  →  4×2 행렬",
        "선형변환 · Y = A @ W  — 150×4 원본(정규화·중심화)을 150×2로 축소",
        "산점도 · 가로 PC1 = A·v1, 세로 PC2 = A·v2  (품종별 색)",
    ]


def iris_pca_2d_explanation() -> str:
    return ""


def iris_pca_2d_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "4차원 → 2차원 선형변환",
            "variant": "iris",
            "items": iris_pca_2d_bullet_items(),
        },
        {"type": "iris_pca_scatter"},
        {"type": "iris_pca_weights"},
    ]


def make_iris_pca_scatter_chart(df: pd.DataFrame) -> dict[str, Any]:
    data = _iris_minmax_cov_eigen(df)
    if data is None:
        return {"type": "none"}

    weights = data["evecs"][:, :2]
    scores = data["matrix_a"] @ weights
    groups: list[str] | None = None
    labels: list[str] | None = None
    if "품종" in df.columns:
        groups = df.loc[data["index"], "품종"].astype(str).tolist()
    if "번호" in df.columns:
        labels = df.loc[data["index"], "번호"].astype(str).tolist()

    points: list[dict[str, Any]] = []
    for i, (x, y) in enumerate(scores):
        item: dict[str, Any] = {"x": round(float(x), 3), "y": round(float(y), 3)}
        if groups is not None and i < len(groups):
            item["group"] = groups[i]
        if labels is not None and i < len(labels):
            item["label"] = labels[i]
        points.append(item)

    ratios = data["explained_ratio_percent"]
    pc1 = ratios[0] if ratios else 0
    pc2 = ratios[1] if len(ratios) > 1 else 0

    return {
        "type": "scatter",
        "title": "선형변환 산점도  Y = A @ W",
        "xLabel": f"PC1 (λ₁, {pc1}%)",
        "yLabel": f"PC2 (λ₂, {pc2}%)",
        "points": points,
    }


def make_iris_pca_weight_table(df: pd.DataFrame) -> dict[str, Any]:
    data = _iris_minmax_cov_eigen(df)
    if data is None:
        return {"type": "none"}

    features = data["features"]
    evals = data["evals"]
    evecs = data["evecs"]
    ratios = data["explained_ratio_percent"]
    n_rows = data["n_rows"]

    rows: list[list[Any]] = [
        ["고유값 λ", round(float(evals[0]), 4), round(float(evals[1]), 4)],
        ["설명 비율 (%)", ratios[0], ratios[1]],
    ]
    for i, feature in enumerate(features):
        rows.append([f"{feature} 가중치", round(float(evecs[i, 0]), 3), round(float(evecs[i, 1]), 3)])

    return {
        "type": "table",
        "title": "가중치 행렬 W = [v1 v2]",
        "columns": ["항목", "v1 (PC1)", "v2 (PC2)"],
        "rows": rows,
        "footnote": {
            "title": "선형변환",
            "formula": {
                "symbol": "Y",
                "expression": "A @ W",
                "note": f"({n_rows}×4) @ (4×2) → {n_rows}×2  · 결과 행렬 크기 (나눗셈 아님)",
            },
            "steps": [
                f"A : Min-Max·중심화한 {n_rows}×4 행렬 (송이 × 변수 4개)",
                "W = [v1 v2] : 정보량이 큰 두 고유벡터 (4×2)",
                f"행렬곱 규칙 · (m×k) @ (k×n) = (m×n) 이므로 Y는 {n_rows}×2 (가로 PC1, 세로 PC2)",
            ],
        },
    }


def make_iris_biplot_chart(df: pd.DataFrame) -> dict[str, Any]:
    data = _iris_minmax_cov_eigen(df)
    if data is None:
        return {"type": "none"}

    weights = data["evecs"][:, :2]
    scores = data["matrix_a"] @ weights
    groups: list[str] | None = None
    labels: list[str] | None = None
    if "품종" in df.columns:
        groups = df.loc[data["index"], "품종"].astype(str).tolist()
    if "번호" in df.columns:
        labels = df.loc[data["index"], "번호"].astype(str).tolist()

    points: list[dict[str, Any]] = []
    for i, (x, y) in enumerate(scores):
        item: dict[str, Any] = {"x": round(float(x), 3), "y": round(float(y), 3)}
        if groups is not None and i < len(groups):
            item["group"] = groups[i]
        if labels is not None and i < len(labels):
            item["label"] = labels[i]
        points.append(item)

    score_scale = float(np.max(np.abs(scores))) or 1.0
    loading_scale = float(np.max(np.abs(weights))) or 1.0
    arrow_scale = 0.85 * score_scale / loading_scale
    arrows = [
        {
            "name": feature,
            "x": round(float(weights[i, 0] * arrow_scale), 3),
            "y": round(float(weights[i, 1] * arrow_scale), 3),
        }
        for i, feature in enumerate(data["features"])
    ]
    ratios = data["explained_ratio_percent"]
    pc1 = ratios[0] if ratios else 0
    pc2 = ratios[1] if len(ratios) > 1 else 0

    return {
        "type": "biplot",
        "title": "바이플롯",
        "xLabel": f"PC1 ({pc1}%)",
        "yLabel": f"PC2 ({pc2}%)",
        "points": points,
        "arrows": arrows,
    }


def make_iris_biplot_explain_table(df: pd.DataFrame) -> dict[str, Any]:
    data = _iris_minmax_cov_eigen(df)
    if data is None:
        return {"type": "none"}

    weights = data["evecs"][:, :2]
    rows: list[list[Any]] = []
    for i, feature in enumerate(data["features"]):
        w1 = float(weights[i, 0])
        w2 = float(weights[i, 1])
        length = float(np.hypot(w1, w2))
        rows.append([feature, round(w1, 3), round(w2, 3), round(length, 3)])

    n_rows = data["n_rows"]
    return {
        "type": "table",
        "title": "그래프를 그리는 방법",
        "columns": ["변수", "w₁ (PC1)", "w₂ (PC2)", "길이"],
        "rows": rows,
        "footnote": {
            "title": "점과 화살표를 같은 PC1·PC2 평면에 겹칩니다",
            "formula": {
                "symbol": "Y",
                "expression": "A @ W",
                "note": (
                    f"({n_rows}×4) @ (4×2) → {n_rows}×2  · "
                    "150송이 × PC 두 축. 150×2로 나누지 않음"
                ),
            },
            "extraFormulas": [
                {
                    "symbol": "길이",
                    "radicand": "w1^2 + w2^2",
                }
            ],
            "steps": [
                (
                    f"점 · Y = A @ W. A는 {n_rows}×4, W는 4×2이므로 결과는 {n_rows}×2 "
                    "(가로 PC1, 세로 PC2, 품종별 색). 분수처럼 보이는 150×2는 나눗셈이 아니라 행렬 크기"
                ),
                "화살표 · 변수마다 W의 한 행 (w₁, w₂)을 원점에서 그림. 한 고유벡터의 앞 두 값이 아님",
                "스케일 · 화살표가 점과 같은 축에 보이게 (w₁, w₂) × 0.85 × max|Y| / max|W|",
                "길이(위 식)가 클수록 그 변수가 PC1·PC2에 기여가 큼. 화살표 쪽 점은 그 변수가 큰 관측치",
            ],
        },
    }
