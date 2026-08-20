from __future__ import annotations

import math
from typing import Any

import numpy as np
import pandas as pd

HEIGHT_COL = "키(cm)"
WEIGHT_COL = "몸무게(kg)"
SIGMA_SPREAD = 2.0


def _minmax(values: np.ndarray) -> tuple[np.ndarray, float, float]:
    lo = float(values.min())
    hi = float(values.max())
    span = hi - lo or 1.0
    return (values - lo) / span, lo, hi


def _nice_step(span: float, target: int = 5) -> float:
    if span <= 0:
        return 1.0
    raw = span / target
    magnitude = 10 ** math.floor(math.log10(raw))
    for factor in (1.0, 2.0, 2.5, 5.0, 10.0):
        step = magnitude * factor
        if span / step <= target + 1:
            return step
    return magnitude * 10.0


def _nice_ticks(vmin: float, vmax: float, target: int = 5) -> list[float]:
    if vmax <= vmin:
        return [round(vmin, 2)]
    step = _nice_step(vmax - vmin, target)
    start = math.floor(vmin / step) * step
    ticks: list[float] = []
    value = start
    while value <= vmax + step * 0.25:
        if value >= vmin - step * 0.25:
            ticks.append(round(value, 2))
        value += step
    return ticks


def _axis_bounds(values: list[float], pad_ratio: float = 0.05) -> tuple[float, float, list[float]]:
    lo = float(min(values))
    hi = float(max(values))
    pad = (hi - lo) * pad_ratio or 0.5
    rough_lo, rough_hi = lo - pad, hi + pad
    ticks = _nice_ticks(rough_lo, rough_hi)
    if ticks:
        return ticks[0], ticks[-1], ticks
    return rough_lo, rough_hi, [round(rough_lo, 2), round(rough_hi, 2)]


def _direction_scale(unit: np.ndarray, range_x: float, range_y: float) -> float:
    return float(math.sqrt((unit[0] * range_x) ** 2 + (unit[1] * range_y) ** 2)) or 1.0


def _semi_axes_from_eigenvalues(
    evals: np.ndarray,
    units: list[np.ndarray],
    range_x: float,
    range_y: float,
    nxc: np.ndarray,
    nyc: np.ndarray,
    sigma: float = SIGMA_SPREAD,
) -> list[float]:
    """Return normalized-space semi-axes whose original-space lengths follow sqrt(λ) ratio."""
    base_proj = nxc * units[0][0] + nyc * units[0][1]
    base_semi = float(np.std(base_proj) * sigma) or float(math.sqrt(float(evals[0])) * sigma)
    length_v1 = base_semi * _direction_scale(units[0], range_x, range_y)
    semis: list[float] = []
    for i in range(2):
        target_length = length_v1 * math.sqrt(float(evals[i]) / float(evals[0]))
        semis.append(target_length / _direction_scale(units[i], range_x, range_y))
    return semis


def _eigen_decomposition(df: pd.DataFrame) -> dict[str, Any] | None:
    work = df[[HEIGHT_COL, WEIGHT_COL]].dropna()
    if len(work) < 3:
        return None

    x = work[HEIGHT_COL].to_numpy(dtype=float)
    y = work[WEIGHT_COL].to_numpy(dtype=float)
    mean_x = float(x.mean())
    mean_y = float(y.mean())

    nx, _min_x, max_x = _minmax(x)
    ny, _min_y, max_y = _minmax(y)
    range_x = max_x - _min_x or 1.0
    range_y = max_y - _min_y or 1.0

    nxc = nx - float(nx.mean())
    nyc = ny - float(ny.mean())
    cov = np.cov(nxc, nyc)
    evals, evecs = np.linalg.eigh(cov)
    order = np.argsort(evals)[::-1]
    evals = evals[order]
    evecs = evecs[:, order]

    units: list[np.ndarray] = []
    for i in range(2):
        direction = evecs[:, i]
        norm = float(np.linalg.norm(direction)) or 1.0
        units.append(direction / norm)

    semis_norm = _semi_axes_from_eigenvalues(evals, units, range_x, range_y, nxc, nyc)

    return {
        "n": len(x),
        "x": x,
        "y": y,
        "mean_x": mean_x,
        "mean_y": mean_y,
        "range_x": range_x,
        "range_y": range_y,
        "evals": evals,
        "evecs": evecs,
        "semis_norm": semis_norm,
        "units": units,
    }


def _to_original_delta(unit: np.ndarray, semi_norm: float, range_x: float, range_y: float) -> tuple[float, float]:
    return (
        float(unit[0] * semi_norm * range_x),
        float(unit[1] * semi_norm * range_y),
    )


def _ellipse_points(
    mean_x: float,
    mean_y: float,
    units: list[np.ndarray],
    semis_norm: list[float],
    range_x: float,
    range_y: float,
    steps: int = 72,
) -> list[dict[str, float]]:
    ax1 = _to_original_delta(units[0], semis_norm[0], range_x, range_y)
    ax2 = _to_original_delta(units[1], semis_norm[1], range_x, range_y)
    points: list[dict[str, float]] = []
    for idx in range(steps + 1):
        theta = 2.0 * math.pi * idx / steps
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        points.append(
            {
                "x": round(mean_x + ax1[0] * cos_t + ax2[0] * sin_t, 2),
                "y": round(mean_y + ax1[1] * cos_t + ax2[1] * sin_t, 2),
            }
        )
    return points


def make_eigen_scatter_chart(df: pd.DataFrame, max_points: int = 700) -> dict[str, Any]:
    data = _eigen_decomposition(df)
    if data is None:
        return {"type": "none"}

    x, y = data["x"], data["y"]
    mean_x, mean_y = data["mean_x"], data["mean_y"]
    range_x, range_y = data["range_x"], data["range_y"]
    evals = data["evals"]
    units = data["units"]
    semis_norm = data["semis_norm"]

    arrows: list[dict[str, Any]] = []
    for i in range(2):
        dx, dy = _to_original_delta(units[i], semis_norm[i], range_x, range_y)
        arrows.append(
            {
                "name": f"v{i + 1}",
                "label": f"v{i + 1} (λ={float(evals[i]):.4f})",
                "x1": round(mean_x - dx, 2),
                "y1": round(mean_y - dy, 2),
                "x2": round(mean_x + dx, 2),
                "y2": round(mean_y + dy, 2),
                "eigenvalue": round(float(evals[i]), 4),
                "vector": [round(float(units[i][0]), 3), round(float(units[i][1]), 3)],
                "semi_axis": round(semis_norm[i], 4),
            }
        )

    n = data["n"]
    if n > max_points:
        rng = np.random.default_rng(42)
        pick = rng.choice(n, max_points, replace=False)
        xs, ys = x[pick], y[pick]
    else:
        xs, ys = x, y

    points = [{"x": round(float(a), 2), "y": round(float(b), 2)} for a, b in zip(xs, ys, strict=True)]
    ellipse = _ellipse_points(mean_x, mean_y, units, semis_norm, range_x, range_y)
    extent_x = [p["x"] for p in points] + [a["x1"] for a in arrows] + [a["x2"] for a in arrows]
    extent_y = [p["y"] for p in points] + [a["y1"] for a in arrows] + [a["y2"] for a in arrows]
    x_min, x_max, x_ticks = _axis_bounds(extent_x)
    y_min, y_max, y_ticks = _axis_bounds(extent_y)

    total = float(evals.sum()) or 1.0
    ratios = [round(float(v / total) * 100, 1) for v in evals]

    return {
        "type": "eigen_scatter",
        "title": "키·몸무게 산점도와 고유벡터",
        "xLabel": HEIGHT_COL,
        "yLabel": WEIGHT_COL,
        "points": points,
        "mean": {"x": round(mean_x, 2), "y": round(mean_y, 2), "label": "평균(중심)"},
        "arrows": arrows,
        "ellipse": ellipse,
        "xDomain": [round(x_min, 2), round(x_max, 2)],
        "yDomain": [round(y_min, 2), round(y_max, 2)],
        "xTicks": x_ticks,
        "yTicks": y_ticks,
        "eigenvalues": [round(float(v), 4) for v in evals],
        "explained_ratio_percent": ratios,
        "n_rows": int(n),
        "normalization": "minmax",
    }


def make_eigen_table_chart(df: pd.DataFrame) -> dict[str, Any]:
    data = _eigen_decomposition(df)
    if data is None:
        return {"type": "none"}

    evals, evecs = data["evals"], data["evecs"]
    total = float(evals.sum()) or 1.0
    rows = [
        ["고윳값 λ(정보량)", round(float(evals[0]), 4), round(float(evals[1]), 4)],
        ["정보량 비율 (%)", round(float(evals[0] / total) * 100, 1), round(float(evals[1] / total) * 100, 1)],
        [f"{HEIGHT_COL} 가중치", round(float(evecs[0, 0]), 3), round(float(evecs[0, 1]), 3)],
        [f"{WEIGHT_COL} 가중치", round(float(evecs[1, 0]), 3), round(float(evecs[1, 1]), 3)],
    ]

    return {
        "type": "table",
        "title": "Min-Max 정규화 기준 고유값 · 고유벡터",
        "columns": ["항목", "v1 (성분 1축)", "v2 (성분 2축)"],
        "rows": rows,
        "footnote": {
            "title": "Min-Max 정규화",
            "formula": {
                "symbol": "z",
                "numerator": "x − min(x)",
                "denominator": "max(x) − min(x)",
            },
            "steps": [
                "키(cm), 몸무게(kg) 각 변수 x에 위 식을 적용 → 0 ≤ z ≤ 1",
                "z에서 변수별 평균을 빼 중심화",
                "공분산 행렬의 고유값 λ, 고유벡터 v 계산",
                "단위·범위만 맞춤 — 상관 구조와 정보량 비율은 유지",
            ],
        },
    }
