from __future__ import annotations

from typing import Any

import numpy as np

from .svd import CUSTOMERS, MISSING_CUSTOMER, MISSING_MOVIE, MOVIES, RATINGS


def tf_intro_explanation() -> str:
    return ""


def tf_intro_bullet_items() -> list[str]:
    return [
        "Transformer : 문장·시계열처럼 순서가 있는 데이터를 Attention으로 처리하는 딥러닝 구조",
        "Query(Q) : 「나의 차원의 정보량은 얼마인가」라는 질문",
        "Key(K) : 그 질문에 대한 답 — 과거의 다른 데이터를 보고, 그 정보량과 유사성을 가진 데이터를 찾음",
        "Value(V) : 찾은 과거 데이터와 나의 차원이 얼마나 유사한지를 내적으로 계산",
        "Attention : 그 내적 값을 소프트맥스로 확률화하고, 확률적 기댓값으로 추정하여 계산",
    ]


def tf_intro_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "Transformer란",
            "variant": "intro",
            "items": tf_intro_bullet_items(),
        }
    ]


def make_tf_ratings_table() -> dict[str, Any]:
    columns = ["영화", *CUSTOMERS]
    rows: list[list[Any]] = []
    highlight_cells: list[list[int]] = []
    for row_idx, movie in enumerate(MOVIES):
        row: list[Any] = [movie]
        for col_idx, customer in enumerate(CUSTOMERS):
            value = RATINGS[movie][customer]
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
        "footnote": f"{MISSING_CUSTOMER} × {MISSING_MOVIE} 한 칸만 빈 칸(—) — Attention으로 평점을 추정",
    }


TF_QUERY_MOVIES = ["영화 A", "영화 B", "영화 C", "영화 D"]
TF_KEY_CUSTOMERS = ["이순신", "장보고", "허준"]


def _tf_rating_vector(customer: str, movies: list[str]) -> np.ndarray:
    return np.array([float(RATINGS[movie][customer] or 0.0) for movie in movies], dtype=float)


def _softmax(values: np.ndarray) -> np.ndarray:
    shifted = values - float(values.max())
    exp = np.exp(shifted)
    return exp / exp.sum()


def _fmt1(value: float) -> float:
    return round(float(value), 1)


def _fmt6(value: float) -> float:
    return round(float(value), 6)


def _tf_qk_context() -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, float]:
    query = _tf_rating_vector(MISSING_CUSTOMER, TF_QUERY_MOVIES)
    keys = np.vstack([_tf_rating_vector(name, TF_QUERY_MOVIES) for name in TF_KEY_CUSTOMERS])
    scores = keys @ query
    attention = _softmax(scores)
    values = np.array(
        [float(RATINGS[MISSING_MOVIE][name] or 0.0) for name in TF_KEY_CUSTOMERS],
        dtype=float,
    )
    weighted = attention * values
    predicted = float(weighted.sum())
    return query, keys, scores, attention, values, weighted, predicted


def make_tf_query_key_tables() -> list[dict[str, Any]]:
    query, keys, _, _, _, _, _ = _tf_qk_context()
    movie_cols = ["영화 A", "영화 B", "영화 C", "영화 D"]
    return [
        {
            "type": "table",
            "title": "Query Q — 홍길동 (영화 A~D)",
            "columns": ["", *movie_cols],
            "rows": [["홍길동", *[_fmt1(v) for v in query]]],
            "footnote": "질문 : 홍길동의 영화 E 평점은 얼마인가 → 홍길동의 관측 평점 벡터가 Q",
        },
        {
            "type": "table",
            "title": "Key K — 이순신·장보고·허준 (영화 A~D)",
            "columns": ["", *movie_cols],
            "rows": [
                [name, *[_fmt1(v) for v in keys[i]]]
                for i, name in enumerate(TF_KEY_CUSTOMERS)
            ],
            "footnote": "과거 다른 고객의 같은 영화 평점 벡터가 K — Q와 내적해 유사도를 봄",
        },
    ]


def make_tf_softmax_formula_table() -> dict[str, Any]:
    _, _, scores, attention, _, _, _ = _tf_qk_context()
    s_int = [int(v) for v in scores]
    den = "e^67 + e^66 + e^78"
    return {
        "type": "table",
        "title": "softmax — Q·K 유사도",
        "columns": ["", *TF_KEY_CUSTOMERS],
        "rows": [["Q·K 유사도 s", *s_int]],
        "footnote": {
            "title": "softmax (자연상수 e)",
            "formula": {"symbol": ""},
            "extraFormulas": [
                {
                    "symbol": "Attention_이순신",
                    "numerator": "e^67",
                    "denominator": den,
                    "note": f"= {_fmt6(attention[0]):.6f}",
                },
                {
                    "symbol": "Attention_장보고",
                    "numerator": "e^66",
                    "denominator": den,
                    "note": f"= {_fmt6(attention[1]):.6f}",
                },
                {
                    "symbol": "Attention_허준",
                    "numerator": "e^78",
                    "denominator": den,
                    "note": f"= {_fmt6(attention[2]):.6f}",
                },
            ],
            "steps": [],
        },
    }


def make_tf_attention_table() -> dict[str, Any]:
    _, _, scores, attention, values, weighted, predicted = _tf_qk_context()
    return {
        "type": "table",
        "title": "Attention(소프트맥스) → Value 기댓값",
        "columns": ["", *TF_KEY_CUSTOMERS, "합"],
        "rows": [
            ["Q·K 유사도", *[int(v) for v in scores], ""],
            ["Attention 확률", *[_fmt6(v) for v in attention], "1"],
            ["Value (영화 E)", *[_fmt1(v) for v in values], ""],
            ["확률 × Value", *[_fmt6(v) for v in weighted], _fmt6(predicted)],
            ["예측 평점", "", "", "", _fmt1(predicted)],
        ],
        "summary_rows": [4],
        "highlight_cells": [[4, 4]],
        "footnote": (
            "Attention = softmax(Q·K). Value는 각 고객의 영화 E 평점. "
            f"기댓값 = Σ(확률×평점) → 홍길동 영화 E 예측 {_fmt1(predicted)}"
        ),
    }


def make_tf_qkv_tables() -> list[dict[str, Any]]:
    return [*make_tf_query_key_tables(), make_tf_attention_table()]


def tf_attention_explanation() -> str:
    return ""


def tf_attention_bullet_items() -> list[str]:
    return []


def tf_attention_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "QUERY, KEY",
            "variant": "intro",
            "items": tf_attention_bullet_items(),
        },
        {"type": "tf_ratings_table"},
        {"type": "tf_query_key"},
    ]


def tf_multihead_explanation() -> str:
    return ""


def tf_multihead_bullet_items() -> list[str]:
    return [
        "Q·K 내적 → 유사도 점수",
        "softmax → Attention 확률",
        "Value(영화 E 평점) × 확률 → 기댓값으로 빈 칸 평점 추정",
    ]


def tf_multihead_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "Attention, VALUE",
            "variant": "intro",
            "items": tf_multihead_bullet_items(),
        },
        {"type": "tf_softmax_formula"},
        {"type": "tf_attention_calc"},
    ]


def tf_encoder_explanation() -> str:
    return ""


def tf_encoder_bullet_items() -> list[str]:
    return []


def tf_encoder_footnote() -> dict[str, Any]:
    return {
        "title": "PCA · 중심값 정리와의 연결",
        "formula": {"symbol": ""},
        "steps": [
            "PCA : 고윳값(정보량)이 소수 차원에 집중 — 핵심 패턴만 남긴다",
            "중심값 정리 : 데이터는 평균 주변으로 모임 — 만유인력처럼 평균을 향한다",
            "Embedding : 각 객체를 공통 저차원 공간에 두고, Q·K·V가 그 공간에서 유사도·가중치를 학습",
        ],
    }


def tf_embedding_formula_footnote() -> dict[str, Any]:
    return {
        "title": "Query · Key · Value 가중치 조절",
        "formula": {"symbol": ""},
        "extraFormulas": [],
        "steps": [
            "Query는 임베딩 값에 Query 가중치를 곱해 만든다",
            "Key는 임베딩 값에 Key 가중치를 곱해 만든다",
            "Query와 Key를 비교해 얼마나 비슷한지 유사도를 구한다",
            "그 유사도를 softmax로 바꾸어 Attention 확률을 만든다",
            "Value도 임베딩 값에 Value 가중치를 곱해 만든다",
            "Attention 확률과 Value를 곱해 예측값을 만든다",
            "예측값과 실제 영화 E 평점의 차이를 보고 가중치를 다시 조절한다",
        ],
    }


def make_tf_customer_embedding_table() -> dict[str, Any]:
    movie_cols = TF_QUERY_MOVIES
    matrix = np.array(
        [
            [float(RATINGS[movie][customer] or 0.0) for movie in movie_cols]
            for customer in CUSTOMERS
        ],
        dtype=float,
    )
    mean = float(matrix.mean())
    std = float(matrix.std(ddof=0)) or 1.0
    normalized = (matrix - mean) / std
    dims = [f"d{i + 1}" for i in range(len(movie_cols))]
    return {
        "type": "table",
        "title": "Query · Key 임베딩 값",
        "columns": ["고객", *dims],
        "rows": [
            [customer, *[round(float(value), 2) for value in normalized[idx]]]
            for idx, customer in enumerate(CUSTOMERS)
        ],
        "footnote": "홍길동·이순신·장보고·허준의 영화 A~D 값을 공통 공간으로 정규화한 Query·Key 임베딩 예시",
    }


TF_VALUE_WEIGHTS = np.array(
    [
        [0.8, 0.6, 1.0, 0.7],
        [0.9, 0.7, 0.8, 1.0],
        [0.7, 1.0, 0.9, 0.8],
        [1.0, 0.8, 0.7, 0.9],
    ],
    dtype=float,
)
TF_QUERY_WEIGHTS = np.array([0.9, 0.8, 1.0, 0.7], dtype=float)
TF_KEY_WEIGHTS = np.array(
    [
        [0.9, 0.7, 0.8, 1.0],
        [0.7, 1.0, 0.9, 0.8],
        [1.0, 0.8, 0.7, 0.9],
    ],
    dtype=float,
)


def make_tf_value_weight_table() -> dict[str, Any]:
    movie_cols = TF_QUERY_MOVIES
    matrix = np.array(
        [
            [float(RATINGS[movie][customer] or 0.0) for movie in movie_cols]
            for customer in CUSTOMERS
        ],
        dtype=float,
    )
    mean = float(matrix.mean())
    std = float(matrix.std(ddof=0)) or 1.0
    normalized = (matrix - mean) / std
    weighted = normalized * TF_VALUE_WEIGHTS
    dims = [f"d{i + 1}" for i in range(len(movie_cols))]
    rows: list[list[Any]] = []
    for idx, customer in enumerate(CUSTOMERS):
        rows.append([f"{customer} e", *[round(float(v), 2) for v in normalized[idx]]])
        rows.append([f"{customer} W", *[round(float(v), 2) for v in TF_VALUE_WEIGHTS[idx]]])
        rows.append([f"{customer} e×W", *[round(float(v), 2) for v in weighted[idx]]])
    return {
        "type": "table",
        "title": "객체 임베딩 × 가중치",
        "columns": ["", *dims],
        "rows": rows,
        "footnote": "각 객체의 임베딩 벡터에 객체별 가중치를 곱한 예시",
    }


def make_tf_value_embedding_table() -> dict[str, Any]:
    rows = [
        [customer, _fmt1(float(RATINGS[MISSING_MOVIE][customer] or 0.0))]
        for customer in TF_KEY_CUSTOMERS
    ]
    return {
        "type": "table",
        "title": "Value 임베딩 값",
        "columns": ["고객", "v1"],
        "rows": rows,
        "footnote": "홍길동 Query를 제외한 3개의 내적 결과에 대응하는 Value 임베딩",
    }


def make_tf_network_chart() -> dict[str, Any]:
    movie_cols = TF_QUERY_MOVIES
    matrix = np.array(
        [
            [float(RATINGS[movie][customer] or 0.0) for movie in movie_cols]
            for customer in CUSTOMERS
        ],
        dtype=float,
    )
    mean = float(matrix.mean())
    std = float(matrix.std(ddof=0)) or 1.0
    normalized = (matrix - mean) / std
    query = normalized[CUSTOMERS.index(MISSING_CUSTOMER)]
    keys = np.vstack([normalized[CUSTOMERS.index(customer)] for customer in TF_KEY_CUSTOMERS])
    query_w = query * TF_QUERY_WEIGHTS
    keys_w = keys * TF_KEY_WEIGHTS
    scores = keys_w @ query_w
    attention = _softmax(scores)
    values = np.array([float(RATINGS[MISSING_MOVIE][customer] or 0.0) for customer in TF_KEY_CUSTOMERS], dtype=float)
    weighted_values = attention * values
    predicted = float(weighted_values.sum())
    dims = [f"d{i + 1}" for i in range(len(movie_cols))]
    return {
        "type": "tf_network",
        "title": "Transformer 구조도",
        "dims": dims,
        "query": {
            "name": "홍길동 Query",
            "embedding": [round(float(v), 2) for v in query],
            "weights": [round(float(v), 2) for v in TF_QUERY_WEIGHTS],
            "weighted": [round(float(v), 2) for v in query_w],
        },
        "keys": [
            {
                "name": customer,
                "embedding": [round(float(v), 2) for v in keys[idx]],
                "weights": [round(float(v), 2) for v in TF_KEY_WEIGHTS[idx]],
                "weighted": [round(float(v), 2) for v in keys_w[idx]],
                "score": round(float(scores[idx]), 2),
                "value": round(float(values[idx]), 2),
                "attention": round(float(attention[idx]), 6),
                "weightedValue": round(float(weighted_values[idx]), 6),
            }
            for idx, customer in enumerate(TF_KEY_CUSTOMERS)
        ],
        "predicted": round(predicted, 6),
    }


def tf_encoder_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "Embedding",
            "variant": "intro",
            "items": tf_encoder_bullet_items(),
            "footnote": tf_encoder_footnote(),
            "extraFootnotes": [tf_embedding_formula_footnote()],
        },
        {"type": "tf_customer_embedding"},
        {"type": "tf_value_weight"},
        {"type": "tf_value_embedding"},
    ]


def tf_diagram_explanation() -> str:
    return ""


def tf_diagram_bullet_items() -> list[str]:
    return []


def tf_diagram_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "구조도",
            "variant": "intro",
            "items": tf_diagram_bullet_items(),
        },
        {"type": "tf_network"},
    ]


def tf_summary_explanation() -> str:
    return ""


def tf_summary_bullet_items() -> list[str]:
    return [
        "Transformer : Query · Key · Value로 임베딩한 차원에서 각 객체의 가중치를 조절하며 Attention으로 기댓값을 계산하고, 유사한 객체들을 가까이 배치하는 기법",
        "예 ① 기계 번역 : Google Translate · Papago — 문장 내 단어·구절 간 관계를 Attention으로 파악하여 번역",
        "예 ② 대화형 AI : ChatGPT — 입력 문맥에서 중요한 단어·문장에 집중해 답변 생성",
        "예 ③ 콘텐츠 추천 : Netflix · 유튜브 — 사용자 Query와 콘텐츠 Key의 유사도로 선호 콘텐츠 예측",
    ]


def tf_summary_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "요약정리",
            "variant": "intro",
            "items": tf_summary_bullet_items(),
        }
    ]
