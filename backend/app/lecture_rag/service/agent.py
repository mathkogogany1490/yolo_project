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
from .iris_lda import iris_lda_explanation, iris_lda_views
from .iris_cov import (
    iris_cov_eigen_explanation,
    iris_cov_eigen_views,
    iris_pca_2d_explanation,
    iris_pca_2d_views,
)

# 음성/입력으로 01~07을 바꿀 때 쓰는 주제 단어. 보여 주세요류와 함께 써야 한다.
SHOW_SCENE_RULES: list[tuple[tuple[str, ...], SceneId]] = [
    (("고유벡터", "고유벡타", "고윳값", "고유값", "아이겐", "eigen"), "eigen_demo"),
    (("붓꽃데이터", "붓꽃", "아이리스", "아이리스데이터", "iris"), "iris_data"),
    (("선형변환", "선영변환", "차원축소"), "iris_pca_2d"),
    (("공분산", "공분선"), "iris_cov_eigen"),
    (("lda", "엘디에이", "엘디에", "선형판별"), "iris_lda"),
    (("pca", "pc", "피씨에이", "피시에이", "피스이에이", "피시아이", "피씨아이", "비씨에이", "피씨에", "피시에", "피씨", "주성분분석", "주성분"), "intro"),
    (("요약정리", "요약", "바이플롯", "biplot"), "summary"),
]
SHOW_TAILS = (
    "다시한번보여주세요",
    "다시보여주세요",
    "보여주세요",
    "보여주세여",
    "보여주세오",
    "보여주새요",
    "보여주세용",
)

LINEAR_SHOW_MARKERS = ("선형변환", "선영변환", "차원축소", "4차원", "2차원", "가중치행렬")
PCA_INTRO_MARKERS = (
    "pca",
    "피씨에이",
    "피시에이",
    "피스이에이",
    "피시아이",
    "비씨에이",
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
    "티씨에이",
    "피씨에",
    "피시에",
    "피씨",
    "pc에이",
)

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


def has_show_command(text: str) -> bool:
    compact = _fold_pca_stt(_normalize(text))
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
    compact = _fold_pca_stt(_normalize(text))
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
        "그래프: 타원 축 길이 비율 = √(설명 비율) — v1:v2 ≈ √77.3:√22.7.",
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
        "PCA = Principal Component Analysis · 주성분분석",
        "목적 · 많은 변수 → 2~3개 축으로 요약(차원 축소)",
        "고유값 λ · 각 축의 정보량(분산)",
        "고유벡터 v · 변수 가중치(새 축의 방향)",
        "원리 · 공분산·상관 구조에서 정보량 큰 방향을 축으로 선택",
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


def summary_explanation() -> str:
    return ""


def summary_bullet_items() -> list[str]:
    return [
        "PCA · 분산(정보량)이 큰 축으로 4차원 → 2차원  Y = A @ W",
        "LDA · 라벨 평균은 멀게(S_B), 같은 라벨 안 분산은 작게(S_W)",
        "가중치 · 고유벡터의 각 성분이 해당 변수가 새 축에 기여하는 정도",
        "점 · 관측치를 PC1·PC2 좌표로 옮긴 위치",
        "화살표 · 변수마다 (PC1 가중치, PC2 가중치) 두 값으로 그림 — v1·v2의 해당 행",
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
        {"type": "iris_biplot_explain"},
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
        if item in {"intro", "live"}:
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

    direct = match_scene_id(text)
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
    title = "요약정리" if scene == "summary" else None
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
    "iris_biplot_explain",
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
    names = all_columns or columns
    if not openai_enabled():
        return interpret_without_openai(text, current, pca, columns)

    summary = {
        "current_scene": current,
        "current_dataset": source_name,
        "canonical_show_commands": CANONICAL_SHOW_COMMANDS,
        "builtin_datasets": {
            "iris": ["번호", "꽃받침길이", "꽃받침너비", "꽃잎길이", "꽃잎너비", "품종"],
            "sample": ["학생", "수학", "영어", "과학", "공부시간", "수면시간", "과제횟수"],
        },
        "numeric_columns": columns,
        "all_columns": names,
        "categorical_columns": categoricals or [],
        "preview": preview or [],
        "pca": _pca_brief(pca),
    }
    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 실시간 강의 화면입니다.\n"
                    "항상 JSON만 반환합니다. 키: title, explanation, hint, dataset, scene, views.\n"
                    "canonical_show_commands 는 01~07 화면을 여는 대표 문장입니다.\n"
                    "장면 전환은 반드시 '보여 주세요' 또는 '다시 보여 주세요'가 들어 있을 때만 합니다. "
                    "그 말이 없으면 scene은 반드시 current_scene 을 유지하세요. "
                    "'보여줘', '띄워줘', '다시 보자'만으로는 전환하지 마세요.\n"
                    "보여 주세요가 있을 때, 주제가 대표 문장과 비슷하면 해당 scene id를 넣으세요.\n"
                    "중요: 'PCA 보여 주세요' 는 반드시 intro 입니다. "
                    "iris_pca_2d 는 '선형변환 보여 주세요'일 때만입니다. PCA라는 단어만 있으면 05로 보내지 마세요.\n"
                    "질문·설명만 하면 scene은 current_scene 을 유지하세요.\n"
                    "title: 짧은 화면 제목.\n"
                    "explanation: 강사가 방금 말한 내용에 대한 강의 설명 2~5문장.\n"
                    "hint: 다음에 말하면 좋은 한 줄.\n"
                    "dataset: iris, sample, 또는 null.\n"
                    "scene: intro, eigen_demo, iris_data, iris_cov_eigen, iris_pca_2d, iris_lda, summary, live 중 하나.\n"
                    "views: 화면 블록 0~4개. 좌표 배열은 만들지 마세요. 열 이름은 제공된 이름만 쓰세요.\n"
                    "views.type: scatter, histogram, bar, heatmap, table, bullets, iris_biplot\n"
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {"utterance": text, "context": summary},
                    ensure_ascii=False,
                ),
            },
        ],
    )
    content = response.choices[0].message.content or "{}"
    try:
        payload = json.loads(content)
    except json.JSONDecodeError:
        return interpret_without_openai(text, current, pca, columns, all_columns=names)

    requested = str(payload.get("scene") or "").strip()
    compact = _fold_pca_stt(_normalize(text))
    if requested == "iris_pca_2d" and _wants_pca_intro(compact):
        requested = "intro"
    if requested in SCENE_ORDER and requested != current:
        return interpret_without_openai(
            text,
            current,
            pca,
            columns,
            all_columns=names,
            forced_scene=requested,  # type: ignore[arg-type]
        )
    if current in SCENE_ORDER:
        locked = interpret_without_openai(
            text,
            current,
            pca,
            columns,
            all_columns=names,
            forced_scene=current,
        )
        explanation = str(payload.get("explanation") or "").strip()
        if explanation:
            locked.explanation = explanation
        hint = str(payload.get("hint") or "").strip() or None
        if hint:
            locked.hint = hint
        title = str(payload.get("title") or "").strip() or None
        if title:
            locked.title = title
        return locked

    scene = _scene_from_value(requested or "live", "live")
    explanation = str(payload.get("explanation") or "").strip()
    if not explanation:
        explanation = fallback_explanation(scene, pca)
    title = str(payload.get("title") or "").strip() or None
    hint = str(payload.get("hint") or "").strip() or None
    x_column = resolve_column(payload.get("x_column") or payload.get("x"), columns)
    y_column = resolve_column(payload.get("y_column") or payload.get("y"), columns)
    extra_scenes: list[SceneId] = []
    dataset_value = str(payload.get("dataset") or "").strip().lower()
    dataset: DatasetName | None = dataset_value if dataset_value in {"iris", "sample"} else None
    dataset = detect_dataset(text) or dataset
    views = _parse_views(payload.get("views"), columns, names)
    if not views:
        views = views_from_scene(scene, extra_scenes, x_column, y_column)
    if not views:
        views = [{"type": "bullets", "title": title or "핵심", "items": [explanation]}]
        scene = "live"
    return AgentDecision(
        scene=scene,
        explanation=explanation,
        title=title,
        hint=hint,
        x_column=x_column,
        y_column=y_column,
        dataset=dataset,
        extra_scenes=extra_scenes,
        views=views,
    )

