from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from .iris_cov import IRIS_FEATURES, _iris_minmax_cov_eigen


def _fisher_lda(A: np.ndarray, y: np.ndarray) -> dict[str, Any]:
    n_rows, n_cols = A.shape
    classes = np.unique(y)
    n_classes = len(classes)
    mean_overall = A.mean(axis=0)

    s_w = np.zeros((n_cols, n_cols), dtype=float)
    s_b = np.zeros((n_cols, n_cols), dtype=float)
    for cls in classes:
        mask = y == cls
        class_a = A[mask]
        n_c = class_a.shape[0]
        mean_c = class_a.mean(axis=0)
        centered = class_a - mean_c
        s_w += centered.T @ centered
        diff = (mean_c - mean_overall).reshape(-1, 1)
        s_b += n_c * (diff @ diff.T)

    s_w /= max(n_rows - n_classes, 1)
    s_w_reg = s_w + 1e-8 * np.eye(n_cols)
    core = np.linalg.pinv(s_w_reg) @ s_b
    core = (core + core.T) / 2
    evals, evecs = np.linalg.eigh(core)
    order = np.argsort(evals)[::-1]
    evals = np.maximum(evals[order], 0.0)
    evecs = evecs[:, order]
    n_ld = min(2, n_classes - 1, n_cols)
    weights = np.zeros((n_cols, n_ld), dtype=float)
    for j in range(n_ld):
        w = evecs[:, j].astype(float)
        norm = float(np.sqrt(w @ s_w_reg @ w)) or 1.0
        weights[:, j] = w / norm
    scores = A @ weights
    total = float(evals[:n_ld].sum()) or 1.0
    ratios = [round(float(v / total) * 100, 1) for v in evals[:n_ld]]

    return {
        "s_w": s_w,
        "s_b": s_b,
        "evals": evals[:n_ld],
        "weights": weights,
        "scores": scores,
        "explained_ratio_percent": ratios,
        "n_ld": n_ld,
    }


def _iris_lda_bundle(df: pd.DataFrame) -> dict[str, Any] | None:
    base = _iris_minmax_cov_eigen(df)
    if base is None or "품종" not in df.columns:
        return None

    labels = df.loc[base["index"], "품종"].astype(str)
    _, y_encoded = np.unique(labels.to_numpy(), return_inverse=True)
    fisher = _fisher_lda(base["matrix_a"], y_encoded)
    return {**base, **fisher, "labels": labels}


def iris_lda_bullet_items() -> list[str]:
    return [
        "PCA 한계 · 분산이 큰 축만 고르면 품종이 기울어져 겹쳐 보임",
        "LDA 목표 · 품종(라벨)끼리는 멀게, 같은 품종끼리는 뭉치게",
        "S_B · 각 라벨 평균을 서로 멀게 하는 항 (between, 클래스 간)",
        "S_W · 각 라벨 안 분산의 합을 작게 하는 항 (within, 클래스 내)",
        "식 · J(w) = (wᵀ S_B w) / (wᵀ S_W w)  →  Y = A @ W 로 2차원 변환",
    ]


def iris_lda_explanation() -> str:
    return ""


def iris_lda_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "LDA(선형판별분석) · 평균은 멀게, 분산은 작게",
            "variant": "iris",
            "items": iris_lda_bullet_items(),
        },
        {"type": "iris_lda_scatter"},
        {"type": "iris_lda_weights"},
    ]


def make_iris_lda_scatter_chart(df: pd.DataFrame) -> dict[str, Any]:
    data = _iris_lda_bundle(df)
    if data is None:
        return {"type": "none"}

    scores = data["scores"]
    ratios = data["explained_ratio_percent"]
    labels: list[str] | None = None
    if "번호" in df.columns:
        labels = df.loc[data["index"], "번호"].astype(str).tolist()
    groups = data["labels"].tolist()

    points: list[dict[str, Any]] = []
    for i, row in enumerate(scores):
        item: dict[str, Any] = {
            "x": round(float(row[0]), 3),
            "y": round(float(row[1]), 3) if row.shape[0] > 1 else 0.0,
        }
        if i < len(groups):
            item["group"] = groups[i]
        if labels is not None and i < len(labels):
            item["label"] = labels[i]
        points.append(item)

    ld1 = ratios[0] if ratios else 0
    ld2 = ratios[1] if len(ratios) > 1 else 0

    return {
        "type": "scatter",
        "title": "LDA 산점도  Y = A @ W",
        "xLabel": f"LD1 (Fisher, {ld1}%)",
        "yLabel": f"LD2 (Fisher, {ld2}%)",
        "points": points,
    }


def make_iris_lda_weight_table(df: pd.DataFrame) -> dict[str, Any]:
    data = _iris_lda_bundle(df)
    if data is None:
        return {"type": "none"}

    features = data["features"]
    evals = data["evals"]
    weights = data["weights"]
    ratios = data["explained_ratio_percent"]
    n_rows = data["n_rows"]
    n_ld = data["n_ld"]

    columns = ["항목", *[f"w{i + 1} (LD{i + 1})" for i in range(n_ld)]]
    rows: list[list[Any]] = [
        ["Fisher λ", *[round(float(v), 4) for v in evals]],
        ["설명 비율 (%)", *ratios],
    ]
    for i, feature in enumerate(features):
        rows.append([f"{feature} 가중치", *[round(float(weights[i, j]), 3) for j in range(n_ld)]])

    return {
        "type": "table",
        "title": "Fisher 가중치 행렬 W = [w1 w2]",
        "columns": columns,
        "rows": rows,
        "footnote": {
            "title": "평균은 멀게 · 분산은 작게",
            "formula": {
                "symbol": "J(w)",
                "numerator": "wᵀ S_B w  (평균 거리)",
                "denominator": "wᵀ S_W w  (라벨 안 분산)",
            },
            "steps": [
                "S_B : 세토사·버시컬러·버지니카 평균이 서로 멀어지도록",
                "S_W : 같은 품종 안 점들이 퍼진 정도(분산)의 합을 줄이도록",
                f"W = [w1 w2],  Y = A @ W → {n_rows}×2  (LD1, LD2)",
            ],
        },
    }
