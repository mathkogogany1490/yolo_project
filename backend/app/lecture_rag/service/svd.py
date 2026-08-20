from __future__ import annotations

from typing import Any

import numpy as np

CUSTOMERS: list[str] = ["홍길동", "이순신", "장보고", "허준"]
MOVIES: list[str] = ["영화 A", "영화 B", "영화 C", "영화 D", "영화 E"]

# 홍길동은 영화 E를 보지 않음 → 해당 평점을 추정하는 예제
RATINGS: dict[str, dict[str, float | None]] = {
    "영화 A": {"홍길동": 5.0, "이순신": 4.0, "장보고": 3.0, "허준": 5.0},
    "영화 B": {"홍길동": 4.0, "이순신": 5.0, "장보고": 4.0, "허준": 4.0},
    "영화 C": {"홍길동": 3.0, "이순신": 4.0, "장보고": 5.0, "허준": 4.0},
    "영화 D": {"홍길동": 5.0, "이순신": 3.0, "장보고": 4.0, "허준": 5.0},
    "영화 E": {"홍길동": None, "이순신": 5.0, "장보고": 3.0, "허준": 4.0},
}

MISSING_CUSTOMER = "홍길동"
MISSING_MOVIE = "영화 E"


def svd_ratings_bullet_items() -> list[str]:
    return [
        "문제 : 고객이 보지 않은 영화 하나의 평점을 추정",
        "가로(행) : 영화 A, B, C, D, E",
        f"세로(열) : 고객 가명 — {', '.join(CUSTOMERS)}",
        f"값 : 평점 (미관람 — {MISSING_CUSTOMER} · {MISSING_MOVIE})",
    ]


def svd_ratings_explanation() -> str:
    return ""


def svd_ratings_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "영화 평점 예시",
            "variant": "intro",
            "items": svd_ratings_bullet_items(),
        },
        {"type": "svd_ratings_table"},
    ]


def svd_decompose_explanation() -> str:
    return ""


def svd_decompose_bullet_items() -> list[str]:
    return [
        "고객 기준 PCA : A.T @ A 공분산 행렬 → 고윳값 D, 고유벡터 → V 행렬",
        "영화 기준 PCA : A @ A.T 공분산 행렬 → 고윳값 D, 고유벡터 → U 행렬",
        "고윳값 확인 : 두 방향의 고윳값 대각행렬 D는 서로 같음",
        "검증 : 원본 A = U D Vᵀ",
        "예측 : 정보량이 작은 고윳값 2개(σ₃, σ₄)를 제외하고 σ₁, σ₂만으로 Â = U₂ D₂ V₂ᵀ",
    ]


def svd_decompose_views() -> list[dict[str, Any]]:
    return [{"type": "svd_decompose"}]


def svd_summary_explanation() -> str:
    return ""


def svd_summary_bullet_items() -> list[str]:
    return [
        "SVD : 사용자×항목(영화·상품·단어 등) 교차표를 U D Vᵀ로 분해",
        "원리 : 정보량이 큰 고윳값만 남기면 핵심 패턴을 유지하고 빈 칸·잡음을 보완",
        "예 ① 추천 시스템 : Netflix·유튜브 — 미평가·미시청 콘텐츠의 선호도 예측",
        "예 ② 이미지 압축 : 사진 픽셀 행렬을 저 rank로 근사 — JPEG 등 저장 용량 절감",
        "예 ③ 검색·문서 분석(LSA) : 문서×단어 빈도 행렬에서 유사 문서·잠재 주제 추출",
        "예 ④ 노이즈 제거 : MRI·음성·센서 신호에서 작은 고윳값 성분을 버려 잡음 억제",
    ]


def svd_summary_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "요약정리",
            "variant": "intro",
            "items": svd_summary_bullet_items(),
        },
    ]


def _build_matrix() -> np.ndarray:
    """미관람(None)은 평균으로 채워서 행렬 구성"""
    rows = []
    for movie in MOVIES:
        row = []
        for customer in CUSTOMERS:
            v = RATINGS[movie][customer]
            row.append(v if v is not None else 0.0)
        rows.append(row)
    A = np.array(rows, dtype=float)
    # 미관람 셀(0)을 해당 행 평균으로 대체
    for i, movie in enumerate(MOVIES):
        missing = [j for j, c in enumerate(CUSTOMERS) if RATINGS[movie][c] is None]
        if missing:
            known = [j for j in range(len(CUSTOMERS)) if j not in missing]
            mean_val = A[i, known].mean() if known else 3.0
            for j in missing:
                A[i, j] = mean_val
    return A


def _fmt(v: float, digits: int = 3) -> str:
    return f"{v:.{digits}f}"


def make_svd_decompose_tables() -> list[dict[str, Any]]:
    A = _build_matrix()

    # ── 고객 기준 PCA : A.T @ A (4×4) ───────────────────────
    cov_c = A.T @ A
    evals_c, evecs_c = np.linalg.eigh(cov_c)
    idx_c = np.argsort(evals_c)[::-1]
    evals_c = evals_c[idx_c]    # 4개, 내림차순
    evecs_c = evecs_c[:, idx_c] # 4×4

    # ── 영화 기준 PCA : A @ A.T (5×5) ───────────────────────
    cov_m = A @ A.T
    evals_m, evecs_m = np.linalg.eigh(cov_m)
    idx_m = np.argsort(evals_m)[::-1]
    evals_m = evals_m[idx_m]    # 5개, 내림차순
    evecs_m = evecs_m[:, idx_m] # 5×4 (앞 4열만 사용)

    k = len(evals_c)  # 4

    total_c = float(evals_c.sum()) or 1.0
    total_m = float(evals_m[:k].sum()) or 1.0

    # ── ① 고객 기준 PCA → U 행렬 ────────────────────────────
    # 대각: 고윳값 + 정보량 %
    sigma_c = np.sqrt(np.abs(evals_c))
    D_c_diag = [
        f"{float(sigma_c[i]):.2f} ({float(evals_c[i])/total_c*100:.1f}%)"
        for i in range(k)
    ]
    U_rows = [[_fmt(float(evecs_c[r, c])) for c in range(k)] for r in range(len(CUSTOMERS))]

    mat_customer: dict[str, Any] = {
        "type": "matrix_pair",
        "title": "고객 기준 PCA  ( A.T @ A, 4×4 )",
        "left": {
            "label": "D  고윳값 대각행렬 (λ, 정보량%)",
            "row_labels": [f"λ{i+1}" for i in range(k)],
            "col_labels": [f"λ{i+1}" for i in range(k)],
            "diagonal": D_c_diag,
            "is_diagonal": True,
        },
        "right": {
            "label": "V  고유벡터 행렬 (열 = 고유벡터)",
            "row_labels": CUSTOMERS,
            "col_labels": [f"v{i+1}" for i in range(k)],
            "values": U_rows,
        },
    }

    # ── ② 영화 기준 PCA → V 행렬 ────────────────────────────
    sigma_m = np.sqrt(np.abs(evals_m[:k]))
    D_m_diag = [
        f"{float(sigma_m[i]):.2f} ({float(evals_m[i])/total_m*100:.1f}%)"
        for i in range(k)
    ]
    V_rows = [[_fmt(float(evecs_m[r, c])) for c in range(k)] for r in range(len(MOVIES))]

    mat_movie: dict[str, Any] = {
        "type": "matrix_pair",
        "title": "영화 기준 PCA  ( A @ A.T, 5×5, 비영 4개 )",
        "left": {
            "label": "D  고윳값 대각행렬 (λ, 정보량%)",
            "row_labels": [f"λ{i+1}" for i in range(k)],
            "col_labels": [f"λ{i+1}" for i in range(k)],
            "diagonal": D_m_diag,
            "is_diagonal": True,
        },
        "right": {
            "label": "U  고유벡터 행렬 (열 = 고유벡터)",
            "row_labels": MOVIES,
            "col_labels": [f"u{i+1}" for i in range(k)],
            "values": V_rows,
        },
        "footnote": "rank = 4 → 비영 고윳값 4개 (5번째 ≈ 0)",
    }

    # ── ③ A = U @ D @ V.T 검증 행렬식 ──────────────────────
    # numpy SVD 로 정확한 U, σ, Vᵀ 얻기 (부호 정렬 보장)
    U_s, s_vals, Vt_s = np.linalg.svd(A, full_matrices=False)
    # U_s : 5×4, s_vals : 4,  Vt_s : 4×4
    D_mat = np.diag(s_vals)

    A_rec = U_s @ D_mat @ Vt_s   # 5×4 복원 (= 원본 A)

    # U_s: 5×4, D: 4×4 대각, Vt_s: 4×4 → A: 5×4
    U_rows_v = [[_fmt(float(U_s[r, c]), 3) for c in range(k)] for r in range(len(MOVIES))]
    D_diag_v = [_fmt(float(s_vals[i]), 2) for i in range(k)]
    Vt_rows_v = [[_fmt(float(Vt_s[r, c]), 3) for c in range(len(CUSTOMERS))] for r in range(k)]
    A_rows_v  = [[_fmt(float(A[r, c]), 1) for c in range(len(CUSTOMERS))] for r in range(len(MOVIES))]

    mat_verify: dict[str, Any] = {
        "type": "matrix_product",
        "variant": "verify",
        "title": "A = U D Vᵀ 검증",
        "matrices": [
            {
                "label": "U  (5×4)",
                "row_labels": MOVIES,
                "col_labels": [f"u{i+1}" for i in range(k)],
                "values": U_rows_v,
            },
            {
                "label": "D  (4×4)",
                "diagonal": D_diag_v,
                "is_diagonal": True,
                "size": k,
            },
            {
                "label": "Vᵀ  (4×4)",
                "row_labels": [f"v{i+1}" for i in range(k)],
                "col_labels": CUSTOMERS,
                "values": Vt_rows_v,
            },
        ],
        "result": {
            "label": "A  (5×4)",
            "row_labels": MOVIES,
            "col_labels": CUSTOMERS,
            "values": A_rows_v,
        },
        "footnote": "빈 칸(홍길동 · 영화 E)은 행 평균으로 대체 후 계산",
    }

    # ── ④ k=2 예측 : σ₁, σ₂만 사용 ─────────────────────────
    k_pred = 2
    U2 = U_s[:, :k_pred]
    s2 = s_vals[:k_pred]
    Vt2 = Vt_s[:k_pred, :]
    A_pred = U2 @ np.diag(s2) @ Vt2

    movie_idx = MOVIES.index(MISSING_MOVIE)
    cust_idx = CUSTOMERS.index(MISSING_CUSTOMER)
    predicted = float(A_pred[movie_idx, cust_idx])

    U2_rows = [[_fmt(float(U2[r, c]), 3) for c in range(k_pred)] for r in range(len(MOVIES))]
    D2_diag = [_fmt(float(s2[i]), 2) for i in range(k_pred)]
    Vt2_rows = [[_fmt(float(Vt2[r, c]), 3) for c in range(len(CUSTOMERS))] for r in range(k_pred)]
    A_pred_rows = [[_fmt(float(A_pred[r, c]), 1) for c in range(len(CUSTOMERS))] for r in range(len(MOVIES))]

    mat_predict: dict[str, Any] = {
        "type": "matrix_product",
        "variant": "predict",
        "title": "Â = U₂ D₂ V₂ᵀ  예측 (k=2)",
        "matrices": [
            {
                "label": "U₂  (5×2)",
                "row_labels": MOVIES,
                "col_labels": [f"u{i+1}" for i in range(k_pred)],
                "values": U2_rows,
            },
            {
                "label": "D₂  (2×2)",
                "diagonal": D2_diag,
                "is_diagonal": True,
                "size": k_pred,
            },
            {
                "label": "V₂ᵀ  (2×4)",
                "row_labels": [f"v{i+1}" for i in range(k_pred)],
                "col_labels": CUSTOMERS,
                "values": Vt2_rows,
            },
        ],
        "result": {
            "label": "Â  (5×4)",
            "row_labels": MOVIES,
            "col_labels": CUSTOMERS,
            "values": A_pred_rows,
            "highlight_cells": [[movie_idx, cust_idx]],
        },
        "footnote": (
            f"σ₃, σ₄ 제외 · {MISSING_CUSTOMER} × {MISSING_MOVIE} "
            f"예측 평점 ≈ {predicted:.1f}"
        ),
    }

    return [mat_customer, mat_movie, mat_verify, mat_predict]


def make_svd_ratings_table() -> dict[str, Any]:
    columns = ["영화", *CUSTOMERS]
    rows: list[list[Any]] = []
    for movie in MOVIES:
        row: list[Any] = [movie]
        for customer in CUSTOMERS:
            value = RATINGS[movie][customer]
            row.append("—" if value is None else round(float(value), 1))
        rows.append(row)
    return {
        "type": "table",
        "title": "영화 × 고객 평점 테이블",
        "columns": columns,
        "rows": rows,
        "footnote": (
            f"{MISSING_CUSTOMER} 고객은 {MISSING_MOVIE}를 보지 않았습니다. "
            "빈 칸(—)의 평점을 SVD로 추정합니다."
        ),
    }
