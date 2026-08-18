from __future__ import annotations

from io import BytesIO
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.datasets import load_iris

from ..config import DATA_DIR


def make_student_dataset(n: int = 80, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    study = rng.normal(0, 1, n)
    lifestyle = rng.normal(0, 1, n)

    math = 70 + 12 * study + 2 * lifestyle + rng.normal(0, 4, n)
    english = 68 + 11 * study + rng.normal(0, 5, n)
    science = 72 + 10 * study + 3 * lifestyle + rng.normal(0, 4.5, n)
    study_hours = np.clip(4 + 1.5 * study + rng.normal(0, 0.6, n), 0.5, 10)
    sleep_hours = np.clip(7 + 0.8 * lifestyle - 0.3 * study + rng.normal(0, 0.5, n), 4, 10)
    homework = np.clip(8 + 2 * study + rng.normal(0, 1.2, n), 0, 20)

    return pd.DataFrame(
        {
            "학생": [f"S{i + 1:02d}" for i in range(n)],
            "수학": np.round(math, 1),
            "영어": np.round(english, 1),
            "과학": np.round(science, 1),
            "공부시간": np.round(study_hours, 1),
            "수면시간": np.round(sleep_hours, 1),
            "과제횟수": np.round(homework, 1),
        }
    )


def default_csv_path() -> Path:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = DATA_DIR / "students.csv"
    if not path.exists():
        make_student_dataset().to_csv(path, index=False)
    return path


def read_csv_bytes(raw: bytes) -> pd.DataFrame:
    last_error: Exception | None = None
    for encoding in ("utf-8-sig", "utf-8", "cp949", "euc-kr"):
        try:
            return pd.read_csv(BytesIO(raw), encoding=encoding)
        except Exception as exc:  # noqa: BLE001
            last_error = exc
    raise ValueError(f"CSV를 읽지 못했습니다: {last_error}")


def load_sample() -> pd.DataFrame:
    return pd.read_csv(default_csv_path())


IRIS_SPECIES_KO: dict[str, str] = {
    "setosa": "세토사",
    "versicolor": "버시컬러",
    "virginica": "버지니카",
}


def iris_species_label(english: str) -> str:
    ko = IRIS_SPECIES_KO.get(english, english)
    return f"{english}({ko})"


def load_iris_frame() -> pd.DataFrame:
    bundle = load_iris()
    frame = pd.DataFrame(
        bundle.data,
        columns=["꽃받침길이", "꽃받침너비", "꽃잎길이", "꽃잎너비"],
    )
    frame.insert(0, "번호", [f"I{i + 1:03d}" for i in range(len(frame))])
    frame["품종"] = [iris_species_label(str(bundle.target_names[index])) for index in bundle.target]
    return frame


INCH_TO_CM = 2.54
POUND_TO_KG = 0.453592


def load_height_weight_frame(max_rows: int | None = 3000) -> pd.DataFrame:
    path = DATA_DIR / "height_weight.csv"
    if not path.exists():
        raise FileNotFoundError("height_weight.csv가 data 폴더에 없습니다.")
    frame = pd.read_csv(path)
    frame = frame.rename(
        columns={
            "Height(Inches)": "_height_in",
            "Height (Inches)": "_height_in",
            "Weight(Pounds)": "_weight_lb",
            "Weight (Pounds)": "_weight_lb",
            "키(인치)": "_height_in",
            "몸무게(파운드)": "_weight_lb",
        }
    )
    if "_height_in" not in frame.columns or "_weight_lb" not in frame.columns:
        raise ValueError("height_weight.csv에 키·몸무게 열이 필요합니다.")
    out = pd.DataFrame(
        {
            "키(cm)": np.round(frame["_height_in"].astype(float) * INCH_TO_CM, 1),
            "몸무게(kg)": np.round(frame["_weight_lb"].astype(float) * POUND_TO_KG, 1),
        }
    )
    if max_rows and len(out) > max_rows:
        out = out.sample(n=max_rows, random_state=42)
    return out.reset_index(drop=True)


def numeric_columns(df: pd.DataFrame) -> list[str]:
    return [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]


def categorical_columns(df: pd.DataFrame) -> list[str]:
    return [col for col in df.columns if not pd.api.types.is_numeric_dtype(df[col])]


def preview_frame(df: pd.DataFrame, n: int = 6) -> list[dict[str, object]]:
    return df.head(n).replace({np.nan: None}).to_dict(orient="records")
