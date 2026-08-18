from __future__ import annotations

from typing import Literal, TypedDict

from pydantic import BaseModel

SceneId = Literal[
    "live",
    "intro",
    "eigen_demo",
    "iris_data",
    "iris_cov_eigen",
    "iris_pca_2d",
    "iris_lda",
    "summary",
]


class SceneMeta(TypedDict):
    title: str
    has_chart: bool
    hint: str


class SceneItem(BaseModel):
    id: SceneId
    title: str
    hasChart: bool


SCENE_ORDER: list[SceneId] = [
    "intro",
    "eigen_demo",
    "iris_data",
    "iris_cov_eigen",
    "iris_pca_2d",
    "iris_lda",
    "summary",
]

CHART_SCENES: list[SceneId] = [
    "eigen_demo",
    "iris_data",
    "iris_cov_eigen",
    "iris_pca_2d",
    "iris_lda",
]

SCENE_META: dict[SceneId, SceneMeta] = {
    "live": {
        "title": "강의 화면",
        "has_chart": True,
        "hint": "무엇을 보여 줄지 그대로 말씀해 주세요.",
    },
    "intro": {
        "title": "PCA(주성분분석)란",
        "has_chart": False,
        "hint": "고유값과 고유벡터 예시를 보여달라고 말해 보세요.",
    },
    "eigen_demo": {
        "title": "고유값과 고유벡터",
        "has_chart": True,
        "hint": "붓꽃(iris) 데이터 소개 화면으로 이어가 보세요.",
    },
    "iris_data": {
        "title": "Iris(붓꽃) 데이터",
        "has_chart": True,
        "hint": "Min-Max 정규화와 공분산·고유값 화면으로 이어가 보세요.",
    },
    "iris_cov_eigen": {
        "title": "Min-Max · 공분산 · 고유값",
        "has_chart": True,
        "hint": "정보량이 큰 두 축으로 2차원 산점도를 그려 보세요.",
    },
    "iris_pca_2d": {
        "title": "4차원 → 2차원 선형변환",
        "has_chart": True,
        "hint": "LDA(선형판별분석)로 품종 분류가 잘 되는 축을 찾아 보세요.",
    },
    "iris_lda": {
        "title": "LDA(선형판별분석)",
        "has_chart": True,
        "hint": "요약정리 화면으로 이어가 보세요.",
    },
    "summary": {
        "title": "요약정리",
        "has_chart": True,
        "hint": "그래프를 다시 보여달라고 하면 고유값 예시부터 반복합니다.",
    },
}


def scene_list() -> list[SceneItem]:
    return [
        SceneItem(
            id=scene_id,
            title=SCENE_META[scene_id]["title"],
            hasChart=SCENE_META[scene_id]["has_chart"],
        )
        for scene_id in SCENE_ORDER
    ]


def next_chart_scene(current: SceneId) -> SceneId:
    if current not in CHART_SCENES:
        return CHART_SCENES[0]
    index = CHART_SCENES.index(current)
    return CHART_SCENES[(index + 1) % len(CHART_SCENES)]
