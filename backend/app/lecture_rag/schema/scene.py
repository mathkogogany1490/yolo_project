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
    "svd_intro",
    "svd_ratings",
    "svd_decompose",
    "svd_summary",
    "mf_intro",
    "mf_embedding",
    "mf_ratings",
    "mf_model",
    "mf_training",
    "mf_summary",
    "tf_intro",
    "tf_attention",
    "tf_multihead",
    "tf_encoder",
    "tf_diagram",
    "tf_summary",
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
    "svd_intro",
    "svd_ratings",
    "svd_decompose",
    "svd_summary",
    "mf_intro",
    "mf_embedding",
    "mf_ratings",
    "mf_model",
    "mf_training",
    "mf_summary",
    "tf_intro",
    "tf_attention",
    "tf_multihead",
    "tf_encoder",
    "tf_diagram",
    "tf_summary",
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
        "title": "고윳값과 고유벡터의 의미",
        "has_chart": True,
        "hint": "붓꽃(iris) 데이터 소개 화면으로 이어가 보세요.",
    },
    "iris_data": {
        "title": "Iris(붓꽃) 데이터",
        "has_chart": True,
        "hint": "Min-Max 정규화와 공분산·고유값 화면으로 이어가 보세요.",
    },
    "iris_cov_eigen": {
        "title": "붓꽃의 공분산과 고윳값 및 고유벡터",
        "has_chart": True,
        "hint": "정보량이 큰 두 축으로 2차원 산점도를 그려 보세요.",
    },
    "iris_pca_2d": {
        "title": "차원 축소 선형 변환(PCA)",
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
    "svd_intro": {
        "title": "SVD(특이값분해)란",
        "has_chart": False,
        "hint": "영화 평점 테이블 예제로 이어가 보세요.",
    },
    "svd_ratings": {
        "title": "영화 평점 데이터",
        "has_chart": True,
        "hint": "고객이 보지 않은 영화의 평점을 추정하는 문제입니다.",
    },
    "svd_decompose": {
        "title": "영화 행렬 분해",
        "has_chart": True,
        "hint": "요약정리에서 k=2 예측 평점을 확인해 보세요.",
    },
    "svd_summary": {
        "title": "요약정리",
        "has_chart": True,
        "hint": "정보량이 큰 고윳값 λ₁, λ₂만으로 빈 칸 평점을 추정한 결과를 봅니다.",
    },
    "mf_intro": {
        "title": "MF(행렬분해)란",
        "has_chart": False,
        "hint": "중심값(평균값) 정리로 이어가 보세요.",
    },
    "mf_embedding": {
        "title": "임베딩이란",
        "has_chart": True,
        "hint": "표준정규분포 그래프와 임베딩 행렬 중심값 정리를 확인해 보세요.",
    },
    "mf_ratings": {
        "title": "영화 평점 데이터",
        "has_chart": True,
        "hint": "MF 딥러닝에서 사용자·아이템 벡터를 계산합니다.",
    },
    "mf_model": {
        "title": "MF 딥러닝",
        "has_chart": True,
        "hint": "딥러닝 구조도에서 내적과 오차 흐름을 확인해 보세요.",
    },
    "mf_training": {
        "title": "딥러닝 구조도",
        "has_chart": True,
        "hint": "요약정리에서 MF 임베딩·내적·역전파 흐름을 확인해 보세요.",
    },
    "mf_summary": {
        "title": "요약정리",
        "has_chart": False,
        "hint": "MF는 빈 칸 없이 관측값만으로 임베딩과 W를 학습합니다.",
    },
    "tf_intro": {
        "title": "Transformer란",
        "has_chart": False,
        "hint": "QUERY, KEY에서 Attention 계산으로 이어가 보세요.",
    },
    "tf_attention": {
        "title": "QUERY, KEY",
        "has_chart": True,
        "hint": "Attention, VALUE에서 softmax로 확률을 계산합니다.",
    },
    "tf_multihead": {
        "title": "Attention, VALUE",
        "has_chart": True,
        "hint": "Embedding 구조를 살펴봅니다.",
    },
    "tf_encoder": {
        "title": "Embedding",
        "has_chart": True,
        "hint": "Transformer 구조도로 이어가 보세요.",
    },
    "tf_diagram": {
        "title": "구조도",
        "has_chart": False,
        "hint": "요약정리에서 Transformer의 쓰임을 확인해 보세요.",
    },
    "tf_summary": {
        "title": "요약정리",
        "has_chart": False,
        "hint": "Attention으로 문맥을 병렬 처리하는 흐름을 정리합니다.",
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
