from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from typing import Any, Literal

from openai import OpenAI

from ..config import OPENAI_API_KEY, OPENAI_MODEL
from ..schema.scene import CHART_SCENES, SCENE_META, SCENE_ORDER, SceneId, next_chart_scene
from .iris import iris_explanation, iris_views
from .mf import (
    mf_embedding_explanation,
    mf_embedding_views,
    mf_intro_explanation,
    mf_intro_views,
    mf_model_explanation,
    mf_model_views,
    mf_ratings_explanation,
    mf_ratings_views,
    mf_summary_explanation,
    mf_summary_views,
    mf_training_explanation,
    mf_training_views,
)
from .svd import (
    svd_decompose_explanation,
    svd_decompose_views,
    svd_ratings_explanation,
    svd_ratings_views,
    svd_summary_explanation,
    svd_summary_views,
)
from .transformer import (
    tf_attention_explanation,
    tf_attention_views,
    tf_diagram_explanation,
    tf_diagram_views,
    tf_encoder_explanation,
    tf_encoder_views,
    tf_intro_explanation,
    tf_intro_views,
    tf_multihead_explanation,
    tf_multihead_views,
    tf_summary_explanation,
    tf_summary_views,
)
from .iris_lda import iris_lda_explanation, iris_lda_views
from .iris_cov import (
    iris_cov_eigen_explanation,
    iris_cov_eigen_views,
    iris_pca_2d_explanation,
    iris_pca_2d_views,
)

# 음성/입력으로 01~07을 바꿀 때 쓰는 주제 단어.
SHOW_SCENE_RULES: list[tuple[tuple[str, ...], SceneId]] = [
    (
        (
            "고유벡터",
            "고유벡타",
            "고유벡처",
            "고윳값",
            "고유값",
            "고육값",
            "고유갑",
            "아이겐벡터",
            "아이겐밸류",
            "아이겐",
            "eigenvalue",
            "eigenvector",
            "eigen",
        ),
        "eigen_demo",
    ),
    (
        (
            "붓꽃데이터",
            "불꽃데이터",
            "부꽃데이터",
            "붓꽃",
            "불꽃",
            "아이리스데이터",
            "아이리스",
            "irisdata",
            "iris",
        ),
        "iris_data",
    ),
    (
        (
            "선형변환",
            "선영변환",
            "선협변환",
            "차원축소",
            "4차원",
            "사차원",
            "2차원",
            "이차원",
            "가중치행렬",
            "pc1pc2",
            "피씨원",
        ),
        "iris_pca_2d",
    ),
    (
        (
            "공분산행렬",
            "공분산",
            "공분선",
            "상관계수",
            "상관행렬",
            "minmax",
            "민맥스",
            "정규화",
        ),
        "iris_cov_eigen",
    ),
    (
        (
            "lda",
            "엘디에이",
            "엘디아이",
            "엘디에",
            "일디에이",
            "선형판별",
            "판별분석",
            "피셔",
        ),
        "iris_lda",
    ),
    (
        (
            "pca",
            "pc",
            "피씨에이",
            "피시에이",
            "피스이에이",
            "피시아이",
            "피씨아이",
            "비씨에이",
            "비시에이",
            "피사에이",
            "피씨에",
            "피시에",
            "피씨",
            "주성분분석",
            "주성분",
            "피씨에이란",
        ),
        "intro",
    ),
    (
        (
            "svd",
            "특이값분해",
            "특이값",
            "에스브이디",
            "singular",
        ),
        "svd_intro",
    ),
    (
        (
            "평점테이블",
            "영화평점",
            "평점데이터",
            "영화데이터",
            "미관람",
        ),
        "svd_ratings",
    ),
    (
        (
            "행렬분해",
            "udv",
            "고윳값비교",
            "u행렬",
            "v행렬",
            "분해검증",
        ),
        "svd_decompose",
    ),
    (
        (
            "예측값",
            "평점예측",
            "예측평점",
            "svd요약",
        ),
        "svd_summary",
    ),
    (
        (
            "mf",
            "matrixfactorization",
            "행렬분해란",
            "행렬분해모델",
            "잠재요인",
            "잠재요인분해",
            "matrixfactorisation",
        ),
        "mf_intro",
    ),
    (
        (
            "임베딩",
            "embedding",
            "mf임베딩",
            "벡터임베딩",
        ),
        "mf_embedding",
    ),
    (
        (
            "mf평점",
            "mf데이터",
            "mf영화",
        ),
        "mf_ratings",
    ),
    (
        (
            "잠재요인모델",
            "잠재벡터",
            "pq내적",
            "pq모델",
        ),
        "mf_model",
    ),
    (
        (
            "mf학습",
            "경사하강",
            "sgd학습",
            "딥러닝mf",
            "ncf",
        ),
        "mf_training",
    ),
    (
        (
            "mf요약",
            "mf정리",
        ),
        "mf_summary",
    ),
    (
        (
            "트랜스포머란",
            "transformer란",
            "transformer",
            "트랜스포머",
        ),
        "tf_intro",
    ),
    (
        (
            "트랜스포머평점",
            "tf평점",
            "tf영화",
        ),
        "tf_attention",
    ),
    (
        (
            "멀티헤드",
            "multihead",
            "멀티헤드어텐션",
        ),
        "tf_multihead",
    ),
    (
        (
            "인코더디코더",
            "encoderdecoder",
            "인코더",
            "디코더",
        ),
        "tf_encoder",
    ),
    (
        (
            "트랜스포머구조도",
            "tf구조도",
        ),
        "tf_diagram",
    ),
    (
        (
            "트랜스포머요약",
            "tf요약",
            "tf정리",
        ),
        "tf_summary",
    ),
    (
        (
            "요약정리",
            "요약",
            "바이플롯",
            "바리플롯",
            "biplot",
            "마무리",
            "결론",
        ),
        "summary",
    ),
]
SHOW_TAILS = (
    "다시한번보여주세요",
    "다시보여주세요",
    "화면보여주세요",
    "그래프보여주세요",
    "보여주세요",
    "보여주시겠어요",
    "보여주실래요",
    "보여주십쇼",
    "보여주시요",
    "보여주이소",
    "보여주셔요",
    "보여주세여",
    "보여주세오",
    "보여주새요",
    "보여주세용",
    "보여주세",
    "보여줘",
    "보여죠",
    "보여주라",
    "보여봐주세요",
    "보여봐",
    "보호주세요",
    "보요주세요",
    "띄워주세요",
    "띄워줘",
    "다시봅시다",
    "다시보자",
    "다시한번",
)

LINEAR_SHOW_MARKERS = ("선형변환", "선영변환", "선협변환", "차원축소", "4차원", "사차원", "2차원", "이차원", "가중치행렬")
PCA_INTRO_MARKERS = (
    "pca",
    "피씨에이",
    "피시에이",
    "피스이에이",
    "피시아이",
    "비씨에이",
    "비시에이",
    "피사에이",
    "피씨",
    "주성분분석",
    "주성분",
)
PCA_STT_ALIASES = (
    "피씨에이",
    "피시에이",
    "피스이에이",
    "피시아이",
    "피씨아이",
    "비씨에이",
    "비시에이",
    "티씨에이",
    "디씨에이",
    "피사에이",
    "피씨에",
    "피시에",
    "피씨",
    "pc에이",
    "pc에",
)
STT_FOLDS = (
    ("불꽃데이터", "붓꽃데이터"),
    ("부꽃데이터", "붓꽃데이터"),
    ("붓꼿", "붓꽃"),
    ("불꽃", "붓꽃"),
    ("부꽃", "붓꽃"),
    ("고육값", "고유값"),
    ("고유갑", "고유값"),
    ("고윳갑", "고윳값"),
    ("고유벡처", "고유벡터"),
    ("고유벡타", "고유벡터"),
    ("공분선", "공분산"),
    ("선영변환", "선형변환"),
    ("선협변환", "선형변환"),
    ("엘디아이", "lda"),
    ("일디에이", "lda"),
    ("바리플롯", "바이플롯"),
    ("민맥스", "minmax"),
)
NEXT_SCENE_MARKERS = (
    "다음그래프",
    "다음화면",
    "다음차트",
    "다음강의",
    "다른그래프",
    "다른차트",
    "다음거",
    "다음것으로",
)
PREV_SCENE_MARKERS = (
    "이전그래프",
    "이전화면",
    "이전차트",
    "이전화면으로",
    "돌아가",
    "뒤로",
)
SCENE_NUMBER_ALIASES: dict[str, SceneId] = {
    "1": "intro",
    "01": "intro",
    "일번": "intro",
    "첫번째": "intro",
    "첫화면": "intro",
    "2": "eigen_demo",
    "02": "eigen_demo",
    "이번": "eigen_demo",
    "두번째": "eigen_demo",
    "3": "iris_data",
    "03": "iris_data",
    "삼번": "iris_data",
    "세번째": "iris_data",
    "4": "iris_cov_eigen",
    "04": "iris_cov_eigen",
    "사번": "iris_cov_eigen",
    "네번째": "iris_cov_eigen",
    "5": "iris_pca_2d",
    "05": "iris_pca_2d",
    "오번": "iris_pca_2d",
    "다섯번째": "iris_pca_2d",
    "6": "iris_lda",
    "06": "iris_lda",
    "육번": "iris_lda",
    "여섯번째": "iris_lda",
    "7": "summary",
    "07": "summary",
    "칠번": "summary",
    "일곱번째": "summary",
    "마지막": "summary",
}

CANONICAL_SHOW_COMMANDS: dict[str, list[str]] = {
    "intro": ["PCA 보여 주세요", "PCA 다시 보여 주세요"],
    "eigen_demo": [
        "고윳값 보여 주세요",
        "고윳값 다시 보여 주세요",
        "고유벡터 보여 주세요",
        "고유벡터 다시 보여 주세요",
    ],
    "iris_data": ["붓꽃 데이터 보여 주세요", "붓꽃 데이터 다시 보여 주세요"],
    "iris_cov_eigen": ["공분산 보여 주세요", "공분산 다시 보여 주세요"],
    "iris_pca_2d": ["선형변환 보여 주세요", "선형변환 다시 보여 주세요"],
    "iris_lda": ["lda 보여 주세요", "lda 다시 보여 주세요"],
    "summary": ["요약 보여 주세요", "요약 다시 보여 주세요"],
    "svd_intro": ["SVD 보여 주세요", "SVD 다시 보여 주세요"],
    "svd_ratings": ["평점 테이블 보여 주세요", "영화 평점 보여 주세요"],
    "svd_decompose": ["행렬분해 보여 주세요", "행렬분해 다시 보여 주세요"],
    "svd_summary": ["SVD 요약 보여 주세요", "예측값 보여 주세요"],
    "mf_intro": ["MF 보여 주세요", "행렬분해 모델 보여 주세요"],
    "mf_embedding": ["임베딩 보여 주세요", "MF 임베딩 보여 주세요"],
    "mf_ratings": ["MF 평점 테이블 보여 주세요", "MF 영화 평점 보여 주세요"],
    "mf_model": ["MF 딥러닝 보여 주세요", "MF 딥러닝 계산 보여 주세요"],
    "mf_training": ["딥러닝 구조도 보여 주세요", "MF 구조도 보여 주세요"],
    "mf_summary": ["MF 요약 보여 주세요", "MF 요약정리 보여 주세요"],
    "tf_intro": ["Transformer 보여 주세요", "트랜스포머 보여 주세요"],
    "tf_attention": ["Query Key 보여 주세요", "QUERY KEY 보여 주세요", "쿼리 키 보여 주세요"],
    "tf_multihead": ["Attention Value 보여 주세요", "어텐션 밸류 보여 주세요", "소프트맥스 보여 주세요"],
    "tf_encoder": ["Embedding 보여 주세요", "임베딩 보여 주세요", "트랜스포머 임베딩 보여 주세요"],
    "tf_diagram": ["트랜스포머 구조도 보여 주세요", "Transformer 구조도 보여 주세요"],
    "tf_summary": ["트랜스포머 요약 보여 주세요", "Transformer 요약정리 보여 주세요"],
}
PHRASE_RULES: list[tuple[tuple[str, ...], SceneId]] = [
    (("고유값", "고유벡터", "고윳값", "eigenvalue", "eigenvector"), "eigen_demo"),
    (("공분산", "covariance"), "iris_cov_eigen"),
    (("상관계수", "상관행렬", "상관관계", "필드들의상관", "변수상관", "correlation"), "iris_cov_eigen"),
    (("주성분산점", "pc1pc2", "pc1·pc2", "차원축소", "축소한좌표", "축소한산점", "학생위치", "점이모"), "iris_pca_2d"),
    (("설명된분산", "설명분산", "분산비율", "설명력", "스크리", "scree", "분산그래프", "얼마나설명", "몇퍼센트"), "iris_cov_eigen"),
    (("바이플롯", "biplot", "화살표"), "summary"),
    (("로딩", "변수기여", "기여도", "어떤변수", "중요한변수", "영향이큰변수"), "iris_pca_2d"),
    (("아이리스", "붓꽃데이터", "iris데이터", "데이터소개", "붓꽃"), "iris_data"),
    (("minmax", "min-max", "정규화", "행렬곱", "a.t", "공분산고유", "붓꽃공분산"), "iris_cov_eigen"),
    (("선형변환", "4차원", "2차원", "가중치행렬", "y=a"), "iris_pca_2d"),
    (("lda", "선형판별", "판별분석", "fisher", "피셔", "축회전"), "iris_lda"),
    (("원본데이터", "원래데이터", "원래그래프", "원본산점", "원본그래프", "산점도", "분포보여"), "iris_data"),
    (("정리해", "요약해", "요약정리", "마무리", "결론"), "summary"),
    (("pca란", "pca가", "pca", "피씨에이", "주성분분석", "소개할게요", "도입", "무엇인지", "무엇인가"), "intro"),
    (("svd란", "svd가", "svd", "에스브이디", "특이값분해", "특이값", "singular"), "svd_intro"),
    (("평점테이블", "영화평점", "평점데이터", "영화데이터", "미관람", "추정"), "svd_ratings"),
    (("행렬분해", "udv", "고윳값비교", "u행렬", "v행렬", "분해검증"), "svd_decompose"),
    (("예측값", "평점예측", "예측평점", "svd요약"), "svd_summary"),
    (("mf", "matrixfactorization", "행렬분해란", "잠재요인", "matrixfactorisation"), "mf_intro"),
    (("임베딩", "embedding", "mf임베딩", "벡터임베딩"), "mf_embedding"),
    (("mf평점", "mf데이터", "mf영화"), "mf_ratings"),
    (("mf딥러닝", "딥러닝계산", "mf계산"), "mf_model"),
    (("딥러닝구조도", "구조도", "네트워크그림"), "mf_training"),
    (("mf요약", "mf정리"), "mf_summary"),
    (("트랜스포머란", "transformer", "트랜스포머"), "tf_intro"),
    (("쿼리키", "querykey", "query", "쿼리"), "tf_attention"),
    (("어텐션", "attention", "소프트맥스", "softmax", "어텐션밸류", "attentionvalue", "attention value"), "tf_multihead"),
    (("임베딩", "embedding", "tf임베딩", "트랜스포머임베딩"), "tf_encoder"),
    (("트랜스포머구조도", "tf구조도"), "tf_diagram"),
    (("트랜스포머요약", "tf요약", "tf정리"), "tf_summary"),
]


DatasetName = Literal["iris", "sample", "height_weight"]


@dataclass
class AgentDecision:
    scene: SceneId
    explanation: str
    title: str | None = None
    hint: str | None = None
    x_column: str | None = None
    y_column: str | None = None
    dataset: DatasetName | None = None
    extra_scenes: list[SceneId] = field(default_factory=list)
    views: list[dict[str, Any]] = field(default_factory=list)


def openai_enabled() -> bool:
    return bool(OPENAI_API_KEY)


def detect_dataset(text: str) -> DatasetName | None:
    compact = _normalize(text)
    if any(token in compact for token in ("iris", "아이리스", "붓꽃", "꽃잎", "꽃받침", "품종")):
        return "iris"
    if any(token in compact for token in ("키", "몸무게", "height", "weight", "heightweight")):
        return "height_weight"
    if any(token in compact for token in ("학생데이터", "예시데이터", "students", "샘플데이터")):
        return "sample"
    return None


def match_direct_scene(text: str) -> SceneId | None:
    stripped = text.strip()
    if stripped in SCENE_META:
        return stripped  # type: ignore[return-value]
    for scene_id, meta in SCENE_META.items():
        if stripped == meta["title"]:
            return scene_id
    return None


def _fold_pca_stt(compact: str) -> str:
    text = compact
    for alias in sorted(PCA_STT_ALIASES, key=len, reverse=True):
        text = text.replace(alias, "pca")
    return re.sub(r"(?<![a-z])pc(?![a-z])", "pca", text)


def _fold_lecture_stt(compact: str) -> str:
    text = compact
    for src, dst in sorted(STT_FOLDS, key=lambda item: len(item[0]), reverse=True):
        text = text.replace(src, dst)
    return _fold_pca_stt(text)


def has_show_command(text: str) -> bool:
    compact = _fold_lecture_stt(_normalize(text))
    return any(tail in compact for tail in SHOW_TAILS)


def _topic_after_show(compact: str) -> str:
    topic = compact
    for tail in sorted(SHOW_TAILS, key=len, reverse=True):
        topic = topic.replace(tail, "")
    for particle in ("으로", "로", "을", "를", "이", "가", "은", "는", "의", "도", "만"):
        if topic.endswith(particle) and len(topic) > len(particle):
            topic = topic[: -len(particle)]
            break
    return topic


def _close_enough(left: str, right: str) -> bool:
    if not left or not right:
        return False
    if min(len(left), len(right)) < 2:
        return left == right
    if left == right or left in right or right in left:
        return True
    return SequenceMatcher(None, left, right).ratio() >= 0.68


def match_show_scene(text: str) -> SceneId | None:
    if not has_show_command(text):
        return None
    compact = _fold_lecture_stt(_normalize(text))
    topic = _topic_after_show(compact)
    if _wants_pca_intro(compact) or topic in {"pca", "pc"}:
        return "intro"
    ranked: list[tuple[int, SceneId]] = []
    for keywords, scene in SHOW_SCENE_RULES:
        if scene == "intro":
            continue
        for keyword in keywords:
            token = _fold_pca_stt(_normalize(keyword))
            if token and (token in compact or _close_enough(topic, token)):
                ranked.append((len(token), scene))
                break
    if not ranked:
        return None
    ranked.sort(reverse=True)
    return ranked[0][1]


def match_scene_id(text: str) -> SceneId | None:
    stripped = text.strip()
    if stripped in SCENE_ORDER or stripped == "live":
        return stripped  # type: ignore[return-value]
    return None


def _wants_covariance(text: str) -> bool:
    compact = _normalize(text)
    return any(token in compact for token in ("공분산", "covariance"))


def _wants_correlation(text: str) -> bool:
    compact = _normalize(text)
    return any(
        token in compact
        for token in ("상관관계", "상관계수", "상관행렬", "필드들의상관", "변수상관", "correlation", "상관을")
    )


def _normalize(text: str) -> str:
    compact = unicodedata.normalize("NFKC", text)
    compact = re.sub(r"\s+", "", compact).lower()
    return re.sub(r"[.,!?~'\"“”‘’·…。]", "", compact)


def _wants_pca_intro(compact: str) -> bool:
    if any(marker in compact for marker in LINEAR_SHOW_MARKERS):
        return False
    return any(marker in compact for marker in PCA_INTRO_MARKERS)


def resolve_column(name: str | None, columns: list[str]) -> str | None:
    if not name or not columns:
        return None
    if name in columns:
        return name
    lowered = {col.lower(): col for col in columns}
    if name.lower() in lowered:
        return lowered[name.lower()]
    compact = _normalize(name)
    for col in columns:
        token = _normalize(col)
        if token == compact or token in compact or compact in token:
            return col
    return None


def columns_mentioned(text: str, columns: list[str]) -> list[str]:
    compact = _normalize(text)
    found: list[str] = []
    for col in sorted(columns, key=len, reverse=True):
        token = _normalize(col)
        if token and token in compact and col not in found:
            found.append(col)
    return found


def route_by_keyword(text: str, current: SceneId) -> SceneId:
    stripped = text.strip()
    if stripped in SCENE_ORDER:
        return stripped  # type: ignore[return-value]
    for scene_id, meta in SCENE_META.items():
        if stripped == meta["title"]:
            return scene_id

    compact = _normalize(text)

    for keywords, scene in PHRASE_RULES:
        if any(_normalize(keyword) in compact for keyword in keywords):
            if scene == "summary" and str(current).startswith("svd_"):
                return "svd_summary"
            if scene == "summary" and str(current).startswith("mf_"):
                return "mf_summary"
            if scene == "summary" and str(current).startswith("tf_"):
                return "tf_summary"
            return scene

    if any(token in compact for token in ("다른그래프", "다음그래프", "다음화면", "다른차트", "다음차트")):
        return next_chart_scene(current)

    if any(token in compact for token in ("그래프보여", "그래프를보여", "차트보여", "차트띄", "그래프띄", "그림보여")):
        if current in CHART_SCENES:
            return next_chart_scene(current)
        return "iris_pca_2d"

    return current


def eigen_explanation() -> str:
    return ""


def eigen_bullet_items() -> list[str]:
    return [
        "고유값 λ: 해당 축 방향의 분산(정보량).",
        "고유벡터 v: Min-Max 정규화(0~1) 후 변수에 부여되는 가중치.",
        "Min-Max: 각 변수를 (값−최소)/(최대−최소)로 변환 — 단위·범위만 맞춤.",
        "대칭 공분산 행렬의 고유벡터 v1, v2는 서로 수직.",
        "그래프: 타원 축 길이 비율 = √(정보량 비율) — v1:v2 ≈ √77.3:√22.7.",
    ]


def eigen_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "고유값 · 고유벡터",
            "items": eigen_bullet_items(),
        },
        {"type": "eigen_scatter"},
        {"type": "eigen_table"},
    ]


def intro_explanation() -> str:
    return ""


def intro_bullet_items() -> list[str]:
    return [
        "PCA(Principal Component Analysis) : 주성분분석",
        "정보량이 2~3개 성분(축)에 몰려 있는 경향성",
        "고유값 λ : 각 축의 정보량(분산)",
        "고유벡터 v : 변수 가중치(새 축의 방향)",
        "원리 : 공분산으로 고윳값(정보량)과 고유벡터(각 속성의 가중치)를 이용하여 정보량 큰 방향의 성분(축)만 선택하고, 정보량이 작은 성분은 선택하지 않는 방식으로 차원을 축소한다",
    ]


def intro_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "PCA(주성분분석)란",
            "variant": "intro",
            "items": intro_bullet_items(),
        }
    ]


def svd_intro_explanation() -> str:
    return ""


def svd_intro_bullet_items() -> list[str]:
    return [
        "SVD(Singular Value Decomposition) : 특이값 분해",
        "가로 클래스의 각 객체와 세로 클래스의 각 객체 사이의 값을 pivot table로 정리한 테이블을 분석할 때 사용",
        "고윳값 : 가로·세로 클래스의 고윳값(정보량)은 서로 같음",
        "확장 : 정보량이 2~3개 성분에 집중되는 PCA와 같은 경향을 바탕으로, 정보량이 적은 성분은 선택하지 않는 PCA의 확장 기법",
    ]


def svd_intro_footnote() -> dict[str, Any]:
    return {
        "title": "분해와 내적 표현",
        "formula": {
            "symbol": "A",
            "expression": "U @ D @ Vᵀ",
            "note": "U : 가로 클래스 벡터, D : 고윳값 대각행렬, V : 세로 클래스 벡터",
        },
        "extraFormulas": [
            {
                "symbol": "A",
                "expression": "U @ √D @ √D @ Vᵀ",
                "note": "두 클래스의 내적으로 표현",
            }
        ],
        "steps": [],
    }


def svd_intro_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "SVD(특이값분해)란",
            "variant": "intro",
            "items": svd_intro_bullet_items(),
            "footnote": svd_intro_footnote(),
        }
    ]


def summary_explanation() -> str:
    return ""


def summary_bullet_items() -> list[str]:
    return [
        "PCA : 분산(정보량)이 큰 축으로 4차원 → 2차원  Y = A @ W",
        "LDA : 라벨 평균은 멀게(S_B), 같은 라벨 안 분산은 작게(S_W)",
        "가중치 : 고유벡터의 각 성분 = 해당 변수가 새 축에 기여하는 정도",
        "점 : 관측치를 PC1·PC2 좌표로 옮긴 위치",
        "화살표 : 변수마다 (PC1 가중치, PC2 가중치) 두 값으로 그림 — W의 해당 행 (w₁, w₂)",
    ]


def summary_views() -> list[dict[str, Any]]:
    return [
        {
            "type": "bullets",
            "title": "요약정리",
            "variant": "intro",
            "items": summary_bullet_items(),
        },
        {"type": "iris_biplot"},
        {"type": "iris_biplot_eigen"},
        {"type": "iris_biplot_length"},
    ]


def fallback_explanation(scene: SceneId, pca: dict[str, Any] | None) -> str:
    _ = pca
    scripts: dict[SceneId, str] = {
        "live": (
            "말씀하신 내용을 이 화면에 구성합니다. "
            "그래프, 표, 정의, 비교 무엇이든 이어서 말씀해 주세요."
        ),
        "intro": intro_explanation(),
        "eigen_demo": eigen_explanation(),
        "iris_data": iris_explanation(),
        "iris_cov_eigen": iris_cov_eigen_explanation(),
        "iris_pca_2d": iris_pca_2d_explanation(),
        "iris_lda": iris_lda_explanation(),
        "summary": summary_explanation(),
        "svd_intro": svd_intro_explanation(),
        "svd_ratings": svd_ratings_explanation(),
        "svd_decompose": svd_decompose_explanation(),
        "svd_summary": svd_summary_explanation(),
        "mf_intro": mf_intro_explanation(),
        "mf_embedding": mf_embedding_explanation(),
        "mf_ratings": mf_ratings_explanation(),
        "mf_model": mf_model_explanation(),
        "mf_training": mf_training_explanation(),
        "mf_summary": mf_summary_explanation(),
        "tf_intro": tf_intro_explanation(),
        "tf_attention": tf_attention_explanation(),
        "tf_multihead": tf_multihead_explanation(),
        "tf_encoder": tf_encoder_explanation(),
        "tf_diagram": tf_diagram_explanation(),
        "tf_summary": tf_summary_explanation(),
    }
    return scripts[scene]


def _scene_from_value(value: str, current: SceneId) -> SceneId:
    if value in SCENE_ORDER or value == "live":
        return value  # type: ignore[return-value]
    return current


def views_from_scene(
    scene: SceneId,
    extra_scenes: list[SceneId],
    x_column: str | None = None,
    y_column: str | None = None,
) -> list[dict[str, Any]]:
    views: list[dict[str, Any]] = []
    for item in [scene, *extra_scenes]:
        if item in {"intro", "live", "svd_intro", "mf_intro", "tf_intro"}:
            continue
        if item == "summary":
            views.extend(summary_views())
            continue
        if item == "eigen_demo":
            views.extend([{"type": "eigen_scatter"}, {"type": "eigen_table"}])
            continue
        if item == "iris_data":
            views.extend(iris_views())
            continue
        if item == "iris_cov_eigen":
            views.extend(iris_cov_eigen_views())
            continue
        if item == "iris_pca_2d":
            views.extend(iris_pca_2d_views())
            continue
        if item == "iris_lda":
            views.extend(iris_lda_views())
            continue
        if item == "svd_ratings":
            views.extend(svd_ratings_views())
            continue
        if item == "svd_decompose":
            views.extend(svd_decompose_views())
            continue
        if item == "svd_summary":
            views.extend(svd_summary_views())
            continue
        if item == "mf_embedding":
            views.extend(mf_embedding_views())
            continue
        if item == "mf_ratings":
            views.extend(mf_ratings_views())
            continue
        if item == "mf_model":
            views.extend(mf_model_views())
            continue
        if item == "mf_training":
            views.extend(mf_training_views())
            continue
        if item == "mf_summary":
            views.extend(mf_summary_views())
            continue
        if item == "tf_attention":
            views.extend(tf_attention_views())
            continue
        if item == "tf_multihead":
            views.extend(tf_multihead_views())
            continue
        if item == "tf_encoder":
            views.extend(tf_encoder_views())
            continue
        if item == "tf_diagram":
            views.extend(tf_diagram_views())
            continue
        if item == "tf_summary":
            views.extend(tf_summary_views())
            continue
        else:
            views.append({"type": item})
    return views


def _pca_brief(pca: dict[str, Any] | None) -> dict[str, Any]:
    if not pca:
        return {"columns": [], "n_rows": 0, "explained_variance_percent": [], "loadings": []}
    charts = pca.get("charts") or {}
    loadings = charts.get("loadings", {}).get("items", [])
    return {
        "columns": pca.get("columns") or [],
        "n_rows": pca.get("n_rows") or 0,
        "explained_variance_percent": pca.get("explained_variance") or [],
        "cumulative_variance_percent": pca.get("cumulative_variance") or [],
        "loadings": loadings,
    }


def interpret_without_openai(
    text: str,
    current: SceneId,
    pca: dict[str, Any] | None,
    columns: list[str],
    all_columns: list[str] | None = None,
    forced_scene: SceneId | None = None,
) -> AgentDecision:
    names = all_columns or columns
    mentioned = [col for col in columns_mentioned(text, names) if col in columns]
    extra_scenes: list[SceneId] = []
    dataset = detect_dataset(text)
    compact = _normalize(text)
    shown = match_show_scene(text)

    direct = match_scene_id(text) or match_direct_scene(text)
    if forced_scene:
        scene: SceneId = forced_scene
        if forced_scene == "eigen_demo":
            dataset = "height_weight"
        elif forced_scene in {"iris_data", "iris_cov_eigen", "iris_pca_2d", "iris_lda", "summary"}:
            dataset = "iris"
    elif direct:
        scene = direct
        if direct == "eigen_demo":
            dataset = "height_weight"
        elif direct in {"iris_data", "iris_cov_eigen", "iris_pca_2d", "iris_lda", "summary"}:
            dataset = "iris"
    elif shown:
        scene = shown
        if shown == "eigen_demo":
            dataset = "height_weight"
        elif shown in {"iris_data", "iris_cov_eigen", "iris_pca_2d", "iris_lda", "summary"}:
            dataset = "iris"
    else:
        scene = current

    if scene == "summary" and str(current).startswith("svd_"):
        scene = "svd_summary"
    if scene == "summary" and str(current).startswith("mf_"):
        scene = "mf_summary"
    if scene == "summary" and str(current).startswith("tf_"):
        scene = "tf_summary"

    if scene == "iris_data" and dataset is None:
        dataset = "iris"
    if scene == "iris_cov_eigen" and dataset is None:
        dataset = "iris"
    if scene == "iris_pca_2d" and dataset is None:
        dataset = "iris"
    if scene == "iris_lda" and dataset is None:
        dataset = "iris"
    if scene == "summary" and dataset is None:
        dataset = "iris"

    x_col: str | None = None
    y_col: str | None = None
    color: str | None = None
    if not direct:
        if any(token in compact for token in ("품종별", "그룹별")):
            color = "품종" if "품종" in names else None

    explanation = fallback_explanation(scene, pca)
    if scene == "eigen_demo":
        explanation = eigen_explanation()
    if scene == "iris_data":
        explanation = iris_explanation()
    if scene == "iris_cov_eigen":
        explanation = iris_cov_eigen_explanation()
    if scene == "iris_pca_2d":
        explanation = iris_pca_2d_explanation()
    if scene == "iris_lda":
        explanation = iris_lda_explanation()
    if scene == "summary":
        explanation = summary_explanation()
    if scene == "svd_summary":
        explanation = svd_summary_explanation()
    if scene == "mf_summary":
        explanation = mf_summary_explanation()
    title = "요약정리" if scene in {"summary", "svd_summary", "mf_summary", "tf_summary"} else None
    views = views_from_scene(scene, extra_scenes, x_col, y_col)
    if color and views:
        views = [{**view, "color": color} if view.get("type") == "scatter" else view for view in views]
        title = title or f"{x_col} · {y_col} (품종별)"
    if not shown and has_show_command(text) and any(token in compact for token in ("기술통계", "기초통계", "요약표", "describe")):
        scene = "live"
        views = [{"type": "table", "kind": "describe"}]
        title = "기술통계"
        explanation = "숫자 변수의 평균, 표준편차, 최솟값, 최댓값을 표로 보겠습니다."
    elif not shown and has_show_command(text) and any(token in compact for token in ("히스토그램", "도수분포")):
        scene = "live"
        column = mentioned[0] if mentioned else (columns[0] if columns else None)
        views = [{"type": "histogram", "column": column}]
        title = f"{column} 분포" if column else "분포"
        explanation = "선택한 변수가 어느 구간에 많이 모여 있는지 히스토그램으로 봅니다."
    elif not shown and has_show_command(text) and any(token in compact for token in ("미리보기", "원본표", "데이터보여")):
        scene = "live"
        views = [{"type": "table", "kind": "preview"}]
        title = "데이터 미리보기"
        explanation = "지금 불러온 데이터의 앞부분을 표로 보여 드립니다."
    if not views:
        if scene == "intro":
            views = intro_views()
        elif scene == "eigen_demo":
            views = eigen_views()
        elif scene == "iris_data":
            views = iris_views()
        elif scene == "iris_cov_eigen":
            views = iris_cov_eigen_views()
        elif scene == "iris_pca_2d":
            views = iris_pca_2d_views()
        elif scene == "iris_lda":
            views = iris_lda_views()
        elif scene == "summary":
            views = summary_views()
        elif scene == "svd_intro":
            views = svd_intro_views()
        elif scene == "svd_ratings":
            views = svd_ratings_views()
        elif scene == "svd_decompose":
            views = svd_decompose_views()
        elif scene == "svd_summary":
            views = svd_summary_views()
        elif scene == "mf_intro":
            views = mf_intro_views()
        elif scene == "mf_embedding":
            views = mf_embedding_views()
        elif scene == "mf_ratings":
            views = mf_ratings_views()
        elif scene == "mf_model":
            views = mf_model_views()
        elif scene == "mf_training":
            views = mf_training_views()
        elif scene == "mf_summary":
            views = mf_summary_views()
        elif scene == "tf_intro":
            views = tf_intro_views()
        elif scene == "tf_attention":
            views = tf_attention_views()
        elif scene == "tf_multihead":
            views = tf_multihead_views()
        elif scene == "tf_encoder":
            views = tf_encoder_views()
        elif scene == "tf_diagram":
            views = tf_diagram_views()
        elif scene == "tf_summary":
            views = tf_summary_views()
        else:
            views = [{"type": "bullets", "title": title or SCENE_META[scene]["title"], "items": [explanation]}]
    return AgentDecision(
        scene=scene,
        explanation=explanation,
        title=title,
        x_column=x_col,
        y_column=y_col,
        dataset=dataset,
        extra_scenes=extra_scenes,
        views=views,
    )


VIEW_TYPES = {
    "scatter",
    "histogram",
    "bar",
    "heatmap",
    "table",
    "bullets",
    "biplot",
    "eigen_scatter",
    "eigen_table",
    "iris_cov_heatmap",
    "iris_eigen_table",
    "iris_pca_scatter",
    "iris_pca_weights",
    "iris_lda_scatter",
    "iris_lda_weights",
    "iris_biplot",
    "iris_biplot_eigen",
    "iris_biplot_length",
    "iris_biplot_explain",
    "svd_ratings_table",
    "mf_ratings_table",
    "tf_ratings_table",
    "tf_query_key",
    "tf_softmax_formula",
    "tf_attention_calc",
    "tf_customer_embedding",
    "tf_value_weight",
    "tf_value_embedding",
    "tf_network",
    "mf_ratings_embeddings",
    "mf_dl_dot",
    "mf_network",
    "svd_decompose",
}


def _parse_views(raw: object, columns: list[str], all_columns: list[str]) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    views: list[dict[str, Any]] = []
    for item in raw[:4]:
        if not isinstance(item, dict):
            continue
        kind = str(item.get("type") or "").strip().lower()
        if kind not in VIEW_TYPES:
            continue
        view: dict[str, Any] = {"type": kind}
        title = str(item.get("title") or "").strip()
        if title:
            view["title"] = title
        for key in ("x", "y", "x_column", "y_column", "column", "color", "group", "by"):
            raw_name = item.get(key)
            if not raw_name:
                continue
            pool = all_columns if key in {"color", "group", "by"} else columns
            view[key] = resolve_column(raw_name, pool) or resolve_column(raw_name, all_columns) or str(raw_name)
        if item.get("kind"):
            view["kind"] = str(item.get("kind"))
        if item.get("agg"):
            view["agg"] = str(item.get("agg"))
        items = item.get("items")
        if isinstance(items, list):
            view["items"] = [str(entry).strip() for entry in items if str(entry).strip()][:8]
        views.append(view)
    return views


def classify_lecture_intent(text: str, current: SceneId) -> dict[str, Any]:
    client = OpenAI(api_key=OPENAI_API_KEY, timeout=8.0)
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 강의 음성/입력을 걸러내는 분류기입니다. JSON만 반환합니다.\n"
                    "키: intent, scene, explanation\n"
                    "intent 값:\n"
                    "- show_scene: 01~07 강의 화면을 보여 달라는 명령. "
                    "오인식(피씨에이, 보여주세여, 보여줘, 띄워줘)도 명령으로 봅니다.\n"
                    "- question: 지금 화면에 대한 질문/설명 요청. 화면을 바꾸면 안 됩니다.\n"
                    "- ignore: 강의와 무관하거나, 잘린 말, 잡음, 명령이 아님.\n"
                    "scene:\n"
                    "- show_scene일 때만 intro, eigen_demo, iris_data, iris_cov_eigen, "
                    "iris_pca_2d, iris_lda, summary 중 하나.\n"
                    "- question, ignore 는 null.\n"
                    "- 'PCA/주성분분석 보여 주세요' 는 intro. "
                    "iris_pca_2d 는 선형변환·4차원→2차원일 때만.\n"
                    "explanation:\n"
                    "- question일 때만 강의 설명 2~4문장.\n"
                    "- show_scene, ignore 는 빈 문자열.\n"
                    f"현재 화면: {current}\n"
                    f"대표 명령: {json.dumps(CANONICAL_SHOW_COMMANDS, ensure_ascii=False)}"
                ),
            },
            {
                "role": "user",
                "content": json.dumps({"utterance": text, "current_scene": current}, ensure_ascii=False),
            },
        ],
    )
    content = response.choices[0].message.content or "{}"
    payload = json.loads(content)
    intent = str(payload.get("intent") or "ignore").strip().lower()
    if intent not in {"show_scene", "question", "ignore"}:
        intent = "ignore"
    scene = str(payload.get("scene") or "").strip()
    if scene not in SCENE_ORDER:
        scene = ""
    explanation = str(payload.get("explanation") or "").strip()
    return {"intent": intent, "scene": scene or None, "explanation": explanation}


def interpret_utterance(
    text: str,
    current: SceneId,
    pca: dict[str, Any] | None,
    columns: list[str],
    source_name: str = "",
    all_columns: list[str] | None = None,
    categoricals: list[str] | None = None,
    preview: list[dict[str, Any]] | None = None,
) -> AgentDecision:
    _ = source_name, categoricals, preview
    names = all_columns or columns
    if not openai_enabled():
        return interpret_without_openai(text, current, pca, columns, all_columns=names)

    try:
        classified = classify_lecture_intent(text, current)
    except (json.JSONDecodeError, Exception):
        return interpret_without_openai(text, current, pca, columns, all_columns=names)

    intent = classified["intent"]
    requested = classified["scene"]
    compact = _fold_lecture_stt(_normalize(text))
    if requested == "iris_pca_2d" and _wants_pca_intro(compact):
        requested = "intro"

    if intent == "show_scene" and requested in SCENE_ORDER:
        return interpret_without_openai(
            text,
            current,
            pca,
            columns,
            all_columns=names,
            forced_scene=requested,  # type: ignore[arg-type]
        )

    locked = interpret_without_openai(
        text,
        current,
        pca,
        columns,
        all_columns=names,
        forced_scene=current,
    )
    if intent == "question":
        explanation = classified["explanation"]
        if explanation:
            locked.explanation = explanation
    return locked

