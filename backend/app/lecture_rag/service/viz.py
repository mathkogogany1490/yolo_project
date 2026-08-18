from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from .data import numeric_columns
from .eigen import make_eigen_scatter_chart, make_eigen_table_chart
from .iris import make_iris_full_table, make_iris_label_counts_table
from .iris_lda import make_iris_lda_scatter_chart, make_iris_lda_weight_table
from .iris_cov import (
    make_iris_biplot_chart,
    make_iris_biplot_explain_table,
    make_iris_cov_heatmap_chart,
    make_iris_eigen_table_chart,
    make_iris_pca_scatter_chart,
    make_iris_pca_weight_table,
)
from .pca import chart_for_scene, make_raw_scatter
from .stats import make_matrix_chart


def _resolve(name: str | None, columns: list[str]) -> str | None:
    if not name:
        return None
    if name in columns:
        return name
    lowered = {col.lower(): col for col in columns}
    if name.lower() in lowered:
        return lowered[name.lower()]
    compact = "".join(name.split()).lower()
    for col in columns:
        token = "".join(col.split()).lower()
        if token == compact or token in compact or compact in token:
            return col
    return None


def _row_labels(df: pd.DataFrame, work: pd.DataFrame, value_columns: list[str]) -> list[str]:
    if len(df.columns) and df.columns[0] not in value_columns:
        return df.loc[work.index, df.columns[0]].astype(str).tolist()
    return [str(i + 1) for i in range(len(work))]


def make_scatter(
    df: pd.DataFrame,
    x_col: str,
    y_col: str,
    color: str | None = None,
    title: str | None = None,
) -> dict[str, Any]:
    if color and color in df.columns:
        work = df[[x_col, y_col, color]].dropna()
        if len(work) < 2:
            return {"type": "none"}
        labels = _row_labels(df, work, [x_col, y_col])
        points: list[dict[str, Any]] = []
        for i, (_, row) in enumerate(work.iterrows()):
            item: dict[str, Any] = {
                "x": round(float(row[x_col]), 3),
                "y": round(float(row[y_col]), 3),
                "group": str(row[color]),
            }
            if i < len(labels):
                item["label"] = labels[i]
            points.append(item)
        return {
            "type": "scatter",
            "title": title or f"{x_col} · {y_col} ({color})",
            "xLabel": x_col,
            "yLabel": y_col,
            "points": points,
        }
    chart = make_raw_scatter(df, x_col, y_col)
    if title and chart.get("type") != "none":
        chart["title"] = title
    return chart


def make_histogram(df: pd.DataFrame, column: str, title: str | None = None) -> dict[str, Any]:
    series = pd.to_numeric(df[column], errors="coerce").dropna()
    if len(series) < 2:
        return {"type": "none"}
    counts, edges = np.histogram(series.to_numpy(dtype=float), bins=min(10, max(5, int(len(series) ** 0.5))))
    items = [
        {
            "name": f"{edges[i]:.1f}–{edges[i + 1]:.1f}",
            "value": int(counts[i]),
        }
        for i in range(len(counts))
    ]
    return {
        "type": "bar",
        "title": title or f"{column} 분포",
        "xLabel": column,
        "yLabel": "빈도",
        "items": items,
    }


def make_bar(
    df: pd.DataFrame,
    column: str,
    by: str | None = None,
    agg: str = "mean",
    title: str | None = None,
) -> dict[str, Any]:
    if by and by in df.columns:
        work = df[[by, column]].dropna()
        grouped = work.groupby(by)[column]
        series = grouped.mean() if agg != "count" else grouped.count()
        items = [{"name": str(name), "value": round(float(value), 2)} for name, value in series.items()]
        label = "평균" if agg != "count" else "개수"
        return {
            "type": "bar",
            "title": title or f"{by}별 {column} {label}",
            "xLabel": by,
            "yLabel": label,
            "items": items,
        }
    series = pd.to_numeric(df[column], errors="coerce").dropna()
    return {
        "type": "bar",
        "title": title or column,
        "xLabel": column,
        "yLabel": "값",
        "items": [{"name": column, "value": round(float(series.mean()), 2)}],
    }


def make_table(df: pd.DataFrame, kind: str, column: str | None = None, title: str | None = None) -> dict[str, Any]:
    if kind == "counts" and column and column in df.columns:
        if column == "품종":
            chart = make_iris_label_counts_table(df)
            if title and chart.get("type") != "none":
                chart["title"] = title
            return chart
        counts = df[column].astype(str).value_counts()
        return {
            "type": "table",
            "title": title or f"{column} 빈도",
            "columns": [column, "개수"],
            "rows": [[str(name), int(value)] for name, value in counts.items()],
        }
    if kind == "preview":
        preview = df.head(8).replace({np.nan: None})
        columns = [str(col) for col in preview.columns]
        rows = []
        for record in preview.to_dict(orient="records"):
            rows.append([record[col] for col in preview.columns])
        return {
            "type": "table",
            "title": title or "데이터 미리보기",
            "columns": columns,
            "rows": rows,
        }
    if kind == "full":
        chart = make_iris_full_table(df)
        if title and chart.get("type") != "none":
            chart["title"] = title
        return chart
    nums = numeric_columns(df)
    if not nums:
        return {"type": "none"}
    desc = df[nums].describe().round(2)
    columns = ["통계", *list(desc.columns)]
    rows = []
    for stat, row in desc.iterrows():
        rows.append([str(stat), *[round(float(value), 2) for value in row.tolist()]])
    return {
        "type": "table",
        "title": title or "기술통계",
        "columns": columns,
        "rows": rows,
    }


def make_bullets(
    items: list[str],
    title: str | None = None,
    variant: str | None = None,
) -> dict[str, Any]:
    cleaned = [str(item).strip() for item in items if str(item).strip()]
    if not cleaned:
        return {"type": "none"}
    chart: dict[str, Any] = {
        "type": "bullets",
        "title": title or "핵심",
        "items": cleaned[:8],
    }
    if variant in {"intro", "compact", "iris"}:
        chart["variant"] = variant
    return chart


def materialize_view(
    view: dict[str, Any],
    df: pd.DataFrame,
    pca: dict[str, Any] | None,
) -> dict[str, Any]:
    kind = str(view.get("type") or "").strip().lower()
    title = str(view.get("title") or "").strip() or None
    columns = list(df.columns)
    nums = numeric_columns(df)

    if kind == "scatter":
        x_col = _resolve(view.get("x") or view.get("x_column"), nums) or (nums[0] if nums else None)
        y_col = _resolve(view.get("y") or view.get("y_column"), nums) or (nums[1] if len(nums) > 1 else None)
        color = _resolve(view.get("color") or view.get("group"), columns)
        if not x_col or not y_col:
            return {"type": "none"}
        return make_scatter(df, x_col, y_col, color=color, title=title)

    if kind == "histogram":
        column = _resolve(view.get("column"), nums) or (nums[0] if nums else None)
        if not column:
            return {"type": "none"}
        return make_histogram(df, column, title=title)

    if kind == "bar":
        column = _resolve(view.get("column"), nums) or (nums[0] if nums else None)
        by = _resolve(view.get("by"), columns)
        if not column:
            return {"type": "none"}
        return make_bar(df, column, by=by, agg=str(view.get("agg") or "mean"), title=title)

    if kind in {"heatmap", "covariance", "correlation"}:
        scale = str(view.get("kind") or kind)
        if scale not in {"covariance", "correlation"}:
            scale = "correlation"
        chart = make_matrix_chart(df, nums, scale)  # type: ignore[arg-type]
        if title and chart.get("type") != "none":
            chart["title"] = title
        return chart

    if kind == "table":
        column = _resolve(view.get("column"), columns)
        return make_table(df, str(view.get("kind") or "describe"), column=column, title=title)

    if kind == "bullets":
        items = view.get("items") or []
        if not isinstance(items, list):
            items = [items]
        variant = str(view.get("variant") or "").strip() or None
        return make_bullets([str(item) for item in items], title=title, variant=variant)

    if kind == "eigen_scatter":
        return make_eigen_scatter_chart(df)
    if kind == "eigen_table":
        return make_eigen_table_chart(df)
    if kind == "iris_cov_heatmap":
        return make_iris_cov_heatmap_chart(df)
    if kind == "iris_eigen_table":
        return make_iris_eigen_table_chart(df)
    if kind == "iris_pca_scatter":
        return make_iris_pca_scatter_chart(df)
    if kind == "iris_pca_weights":
        return make_iris_pca_weight_table(df)
    if kind == "iris_lda_scatter":
        return make_iris_lda_scatter_chart(df)
    if kind == "iris_lda_weights":
        return make_iris_lda_weight_table(df)
    if kind == "iris_biplot" or kind == "biplot":
        return make_iris_biplot_chart(df)
    if kind == "iris_biplot_explain":
        return make_iris_biplot_explain_table(df)

    if kind in {"eigen_demo"}:
        x_col = _resolve(view.get("x") or view.get("x_column"), nums)
        y_col = _resolve(view.get("y") or view.get("y_column"), nums)
        chart = chart_for_scene(pca, kind, df=df, x_column=x_col, y_column=y_col)  # type: ignore[arg-type]
        if title and chart.get("type") != "none":
            chart["title"] = title
        return chart

    return {"type": "none"}


def materialize_views(
    views: list[dict[str, Any]],
    df: pd.DataFrame,
    pca: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    charts: list[dict[str, Any]] = []
    for view in views[:4]:
        chart = materialize_view(view, df, pca)
        if chart.get("type") != "none":
            charts.append(chart)
    return charts
