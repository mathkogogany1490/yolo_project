from __future__ import annotations

import math
from typing import Any

import numpy as np

from .svd import CUSTOMERS, MOVIES


def mf_intro_explanation() -> str:
    return ""


def mf_intro_bullet_items() -> list[str]:
    return [
        "MF(Matrix Factorization) : 차원(독립변수)을 알 수 없는 객체들에 대해, 차원을 정하는 임베딩 기법",
        "객체들의 차원을 같게 맞춘 뒤 임베딩 벡터끼리 내적을 계산",
        "각 객체의 과거 데이터 값으로 예측값과의 오차를 계산",
        "딥러닝 : 그 오차로 임베딩 가중치를 역전파·경사하강법으로 학습하여 찾음",
        "SVD와 비교 : 객체 사이 값이 없으면 평균으로 채워 계산 → 정확한 값이라 보기 어려움",
        "MF의 의미 : 과거에 존재하지 않는 값은 사용하지 않고, 존재하는 과거 값만으로 각 객체의 차원(임베딩) 벡터를 추정",
    ]


def mf_intro_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "MF(행렬분해)란",
            "variant": "intro",
            "items": mf_intro_bullet_items(),
        }
    ]


def mf_embedding_explanation() -> str:
    return ""


def mf_embedding_bullet_items() -> list[str]:
    return []


def mf_embedding_footnote() -> dict[str, Any]:
    return {
        "title": "중심값(평균값) 정리",
        "formula": {"symbol": ""},
        "steps": [
            "통계적 정리 — 모든 데이터는 평균에 가까이 존재하려 한다.",
        ],
    }


def mf_embedding_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "임베딩이란",
            "variant": "intro",
            "items": mf_embedding_bullet_items(),
            "footnote": mf_embedding_footnote(),
        },
        {"type": "normal_pdf"},
        {"type": "mf_embedding_matrix"},
    ]


def _normal_distribution_points(kind: str) -> list[dict[str, float]]:
    points: list[dict[str, float]] = []
    for x in np.linspace(-4, 4, 161):
        xf = float(x)
        if kind == "pdf":
            y = math.exp(-0.5 * xf * xf) / math.sqrt(2 * math.pi)
        else:
            y = 0.5 * (1.0 + math.erf(xf / math.sqrt(2.0)))
        points.append({"x": round(xf, 2), "y": round(y, 4)})
    return points


def make_normal_pdf_chart() -> dict[str, Any]:
    return {
        "type": "distribution_line",
        "variant": "pdf",
        "title": "표준정규분포",
        "caption": "μ = 0, σ² = 1",
        "xLabel": "z",
        "yLabel": "밀도 φ(z)",
        "points": _normal_distribution_points("pdf"),
    }


def make_normal_cdf_chart() -> dict[str, Any]:
    return {
        "type": "distribution_line",
        "variant": "cdf",
        "title": "표준정규분포 누적분포",
        "caption": "μ = 0, σ² = 1",
        "xLabel": "z",
        "yLabel": "누적확률 Φ(z)",
        "points": _normal_distribution_points("cdf"),
    }


MF_EMBED_ATTRS = [f"d{i + 1}" for i in range(5)]
CLASS1_OBJECTS = ["A", "B", "C"]
CLASS2_OBJECTS = ["X", "Y"]

MF_RATINGS_EMBED_DIM = 4
MF_RATINGS_EMBED_ATTRS = [f"d{i + 1}" for i in range(MF_RATINGS_EMBED_DIM)]


def _global_standardize(matrix: np.ndarray) -> np.ndarray:
    """클래스 내 모든 값의 평균 0, 분산 1."""
    mean = float(matrix.mean())
    std = float(matrix.std(ddof=0))
    if std < 1e-9:
        return matrix - mean
    return (matrix - mean) / std


def _unique_embedding_matrix(n_rows: int, n_cols: int, low: float = -2.0, high: float = 2.0) -> np.ndarray:
    values = np.linspace(low, high, n_rows * n_cols)
    return values.reshape(n_rows, n_cols)


def _class_embedding_table(
    title: str,
    objects: list[str],
    matrix: np.ndarray,
    attrs: list[str] | None = None,
    footnote: str | None = None,
) -> dict[str, Any]:
    dim_labels = attrs or MF_EMBED_ATTRS
    rows: list[list[Any]] = [
        [obj, *[round(float(v), 2) for v in matrix[i]]] for i, obj in enumerate(objects)
    ]
    n_values = matrix.size
    global_mean = round(float(matrix.mean()), 2)
    global_var = round(float(matrix.var(ddof=0)), 2)
    return {
        "type": "table",
        "title": title,
        "columns": ["", *dim_labels],
        "rows": rows,
        "footnote": footnote
        or (
            f"클래스 내 전체 {n_values}개 임베딩 값 — μ = {global_mean}, σ² = {global_var}, "
            "서로 다른 유니크한 벡터"
        ),
    }


def make_mf_embedding_class_tables() -> list[dict[str, Any]]:
    class1 = _global_standardize(_unique_embedding_matrix(len(CLASS1_OBJECTS), len(MF_EMBED_ATTRS)))
    class2 = _global_standardize(_unique_embedding_matrix(len(CLASS2_OBJECTS), len(MF_EMBED_ATTRS)))
    return [
        _class_embedding_table("클래스1 임베딩", CLASS1_OBJECTS, class1),
        _class_embedding_table("클래스2 임베딩", CLASS2_OBJECTS, class2),
    ]


# 5×4 행렬 — 빈 칸 5개 (MF sparse 예시)
MF_RATINGS: dict[str, dict[str, float | None]] = {
    "영화 A": {"홍길동": 5.0, "이순신": 4.0, "장보고": None, "허준": 5.0},
    "영화 B": {"홍길동": 4.0, "이순신": 5.0, "장보고": 4.0, "허준": None},
    "영화 C": {"홍길동": None, "이순신": 4.0, "장보고": 5.0, "허준": 4.0},
    "영화 D": {"홍길동": 5.0, "이순신": None, "장보고": 4.0, "허준": 5.0},
    "영화 E": {"홍길동": None, "이순신": 5.0, "장보고": 3.0, "허준": 4.0},
}

MF_MISSING_COUNT = sum(
    1 for movie in MOVIES for customer in CUSTOMERS if MF_RATINGS[movie][customer] is None
)


def make_mf_ratings_table() -> dict[str, Any]:
    columns = ["영화", *CUSTOMERS]
    rows: list[list[Any]] = []
    highlight_cells: list[list[int]] = []
    for row_idx, movie in enumerate(MOVIES):
        row: list[Any] = [movie]
        for col_idx, customer in enumerate(CUSTOMERS):
            value = MF_RATINGS[movie][customer]
            if value is None:
                row.append("—")
                highlight_cells.append([row_idx, col_idx + 1])
            else:
                row.append(round(float(value), 1))
        rows.append(row)
    return {
        "type": "table",
        "title": "영화 × 고객 평점 테이블",
        "columns": columns,
        "rows": rows,
        "highlight_cells": highlight_cells,
        "footnote": f"빈 칸(—) {MF_MISSING_COUNT}개 — 관측된 평점만 학습에 사용",
    }


def mf_ratings_embedding_matrices() -> tuple[np.ndarray, np.ndarray]:
    movies = np.round(
        _global_standardize(_unique_embedding_matrix(len(MOVIES), MF_RATINGS_EMBED_DIM)),
        2,
    )
    customers = np.round(
        _global_standardize(_unique_embedding_matrix(len(CUSTOMERS), MF_RATINGS_EMBED_DIM)),
        2,
    )
    return movies, customers


def make_mf_ratings_embedding_tables() -> list[dict[str, Any]]:
    movie_matrix, customer_matrix = mf_ratings_embedding_matrices()
    movie_note = (
        f"전체 {movie_matrix.size}개 값 μ = {round(float(movie_matrix.mean()), 2)}, "
        f"σ² = {round(float(movie_matrix.var(ddof=0)), 2)} · 유니크한 벡터"
    )
    customer_note = (
        f"전체 {customer_matrix.size}개 값 μ = {round(float(customer_matrix.mean()), 2)}, "
        f"σ² = {round(float(customer_matrix.var(ddof=0)), 2)} · 유니크한 벡터"
    )
    return [
        _class_embedding_table(
            "영화 임베딩", MOVIES, movie_matrix, MF_RATINGS_EMBED_ATTRS, movie_note
        ),
        _class_embedding_table(
            "고객 임베딩", CUSTOMERS, customer_matrix, MF_RATINGS_EMBED_ATTRS, customer_note
        ),
    ]


def mf_ratings_explanation() -> str:
    return ""


def mf_ratings_bullet_items() -> list[str]:
    return []


def mf_ratings_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "영화 평점 데이터",
            "variant": "intro",
            "items": mf_ratings_bullet_items(),
        },
        {"type": "mf_ratings_table"},
        {"type": "mf_ratings_embeddings"},
    ]


MF_DL_MOVIE = "영화 A"
MF_DL_CUSTOMER = "홍길동"
MF_DL_TARGET = 5.0
MF_DL_MOVIE_W = np.array([0.6, 0.8, 0.4, 1.0])
MF_DL_CUSTOMER_W = np.array([0.7, 0.5, 0.9, 0.3])


def _fmt2(value: float) -> float:
    return round(float(value), 2)


def _vector_weight_table(title: str, object_name: str, embedding: np.ndarray, weights: np.ndarray) -> dict[str, Any]:
    weighted = embedding * weights
    return {
        "type": "table",
        "title": title,
        "columns": ["", *MF_RATINGS_EMBED_ATTRS],
        "rows": [
            [object_name, *[_fmt2(v) for v in embedding]],
            ["W(가중치)", *[_fmt2(v) for v in weights]],
            [f"{object_name}×W", *[_fmt2(v) for v in weighted]],
        ],
        "summary_rows": [2],
    }


def make_mf_dl_dot_payload() -> dict[str, Any]:
    movie_matrix, customer_matrix = mf_ratings_embedding_matrices()
    q = movie_matrix[MOVIES.index(MF_DL_MOVIE)]
    p = customer_matrix[CUSTOMERS.index(MF_DL_CUSTOMER)]
    q_w = q * MF_DL_MOVIE_W
    p_w = p * MF_DL_CUSTOMER_W
    terms = q_w * p_w
    predicted = float(terms.sum())
    error = MF_DL_TARGET - predicted
    loss = error * error
    dL_dPred = -2.0 * error
    dL_dQW = dL_dPred * p_w
    dL_dPW = dL_dPred * q_w
    dL_dW_movie = dL_dQW * q
    dL_dW_user = dL_dPW * p
    return {
        "q": q,
        "p": p,
        "q_w": q_w,
        "p_w": p_w,
        "terms": terms,
        "pred": _fmt2(predicted),
        "err": _fmt2(error),
        "actual": _fmt2(MF_DL_TARGET),
        "loss": _fmt2(loss),
        "dL_dPred": _fmt2(dL_dPred),
        "dL_dW_movie": [_fmt2(v) for v in dL_dW_movie],
        "dL_dW_user": [_fmt2(v) for v in dL_dW_user],
    }


def make_mf_dl_dot_tables() -> list[dict[str, Any]]:
    data = make_mf_dl_dot_payload()
    blanks = [""] * MF_RATINGS_EMBED_DIM
    return [
        _vector_weight_table("영화 A 임베딩 × W", MF_DL_MOVIE, data["q"], MF_DL_MOVIE_W),
        _vector_weight_table("홍길동 임베딩 × W", MF_DL_CUSTOMER, data["p"], MF_DL_CUSTOMER_W),
        {
            "type": "table",
            "title": "내적 → 예측 평점과 오차",
            "columns": ["", *MF_RATINGS_EMBED_ATTRS, "합"],
            "rows": [
                ["영화A×W", *[_fmt2(v) for v in data["q_w"]], ""],
                ["홍길동×W", *[_fmt2(v) for v in data["p_w"]], ""],
                ["항별 곱", *[_fmt2(v) for v in data["terms"]], data["pred"]],
                ["예측 평점 R̂", *blanks, data["pred"]],
                ["실제 평점 R", *blanks, data["actual"]],
                ["오차 R − R̂", *blanks, data["err"]],
            ],
            "summary_rows": [5],
            "highlight_cells": [[5, MF_RATINGS_EMBED_DIM + 1]],
        },
    ]


def make_mf_network_chart() -> dict[str, Any]:
    data = make_mf_dl_dot_payload()
    return {
        "type": "mf_network",
        "title": "딥러닝 구조도",
        "dims": list(MF_RATINGS_EMBED_ATTRS),
        "movie": {
            "name": MF_DL_MOVIE,
            "embedding": [_fmt2(v) for v in data["q"]],
            "weights": [_fmt2(v) for v in MF_DL_MOVIE_W],
            "weighted": [_fmt2(v) for v in data["q_w"]],
        },
        "user": {
            "name": MF_DL_CUSTOMER,
            "embedding": [_fmt2(v) for v in data["p"]],
            "weights": [_fmt2(v) for v in MF_DL_CUSTOMER_W],
            "weighted": [_fmt2(v) for v in data["p_w"]],
        },
        "terms": [_fmt2(v) for v in data["terms"]],
        "predicted": data["pred"],
        "actual": data["actual"],
        "error": data["err"],
        "loss": data["loss"],
        "dL_dPred": data["dL_dPred"],
        "dL_dW_movie": data["dL_dW_movie"],
        "dL_dW_user": data["dL_dW_user"],
    }


def mf_model_explanation() -> str:
    return ""


def mf_model_bullet_items() -> list[str]:
    return []


def mf_model_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "MF 딥러닝",
            "variant": "intro",
            "items": mf_model_bullet_items(),
        },
        {"type": "mf_dl_dot"},
    ]


def mf_training_explanation() -> str:
    return ""


def mf_training_bullet_items() -> list[str]:
    return []


def mf_training_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "딥러닝 구조도",
            "variant": "intro",
            "items": mf_training_bullet_items(),
        },
        {"type": "mf_network"},
    ]


def mf_summary_explanation() -> str:
    return ""


def mf_summary_bullet_items() -> list[str]:
    return [
        "MF : 임베딩을 이용한 딥러닝 기법 — Forward Propagation과 Backpropagation으로 가중치를 학습하여 찾아냄",
        "예 ① 영화·영상 추천 : Netflix, 유튜브 — 시청하지 않은 콘텐츠의 선호도를 추정",
        "예 ② 쇼핑몰 추천 : 쿠팡·아마존 — 구매하지 않은 상품을 사용자·상품 임베딩으로 추천",
        "예 ③ 광고·콘텐츠 매칭 : 사용자와 광고(또는 글) 임베딩의 내적으로 클릭·관심 확률을 예측",
    ]


def mf_summary_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "요약정리",
            "variant": "intro",
            "items": mf_summary_bullet_items(),
        }
    ]
