from __future__ import annotations

from ..schema.dataset import DatasetInfo
from ..schema.scene import scene_list
from .agent import openai_enabled
from .data import load_sample, numeric_columns, preview_frame, read_csv_bytes
from .store import store


def get_dataset_info() -> DatasetInfo:
    return DatasetInfo(
        source_name=store.source_name,
        columns=list(store.df.columns),
        numeric_columns=numeric_columns(store.df),
        selected_columns=store.columns,
        n_rows=int(len(store.df)),
        preview=preview_frame(store.df),
        pca_ready=store.pca is not None,
        explained_variance=store.pca["explained_variance"] if store.pca else [],
        openai=openai_enabled(),
        current_scene=store.current_scene,
        scenes=scene_list(),
    )


def reset_sample() -> DatasetInfo:
    store.set_frame(load_sample(), "students.csv")
    return get_dataset_info()


def upload_dataset(raw: bytes, filename: str) -> DatasetInfo:
    if not raw:
        raise ValueError("빈 파일입니다.")
    frame = read_csv_bytes(raw)
    store.set_frame(frame, filename)
    if len(store.columns) < 2:
        raise ValueError("숫자 열이 2개 이상 있는 CSV가 필요합니다.")
    return get_dataset_info()


def set_columns(columns: list[str] | None) -> DatasetInfo:
    store.set_frame(store.df, store.source_name, columns)
    return get_dataset_info()
