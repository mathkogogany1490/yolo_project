from __future__ import annotations

from typing import Any

from ..schema.lecture import TurnResponse
from ..schema.scene import SCENE_META, SceneId, scene_list
from .agent import (
    AgentDecision,
    detect_dataset,
    eigen_views,
    fallback_explanation,
    intro_views,
    interpret_utterance,
    interpret_without_openai,
    iris_cov_eigen_views,
    iris_lda_views,
    match_show_scene,
    summary_views,
    iris_pca_2d_views,
    iris_views,
    openai_enabled,
    views_from_scene,
)
from .data import categorical_columns, load_height_weight_frame, load_iris_frame, load_sample, numeric_columns, preview_frame
from .pca import chart_for_scene
from .store import store
from .viz import materialize_views


def _apply_dataset(name: str | None) -> None:
    if name == "iris" and store.source_name != "iris.csv":
        store.set_frame(load_iris_frame(), "iris.csv")
    elif name == "height_weight" and store.source_name != "height_weight.csv":
        store.set_frame(load_height_weight_frame(), "height_weight.csv")
    elif name == "sample" and store.source_name != "students.csv":
        store.set_frame(load_sample(), "students.csv")


def _charts_for(decision: AgentDecision) -> list[dict[str, Any]]:
    views = decision.views or views_from_scene(
        decision.scene,
        decision.extra_scenes,
        decision.x_column,
        decision.y_column,
    )
    if views:
        return materialize_views(views, store.df, store.pca)
    scenes: list[SceneId] = [decision.scene, *decision.extra_scenes]
    charts: list[dict[str, Any]] = []
    seen: set[SceneId] = set()
    for scene in scenes:
        if scene in seen:
            continue
        seen.add(scene)
        chart = chart_for_scene(
            store.pca,
            scene,
            df=store.df,
            x_column=decision.x_column,
            y_column=decision.y_column,
        )
        if chart.get("type") != "none":
            charts.append(chart)
    return charts


def _turn_payload(decision: AgentDecision, heard: str = "") -> TurnResponse:
    meta = SCENE_META.get(decision.scene) or SCENE_META["live"]
    charts = _charts_for(decision)
    return TurnResponse(
        scene=decision.scene,
        title=decision.title or meta["title"],
        explanation=decision.explanation,
        hint=decision.hint or meta["hint"],
        heard=heard,
        chart=charts[0] if charts else {"type": "none"},
        charts=charts,
        scenes=scene_list(),
        openai=openai_enabled(),
        explained_variance=store.pca["explained_variance"] if store.pca else [],
        source_name=store.source_name,
    )


def get_lecture_state() -> TurnResponse:
    scene = store.current_scene
    explanation = fallback_explanation(scene, store.pca)
    views = views_from_scene(scene, [], None, None)
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
            views = [{"type": "bullets", "title": SCENE_META[scene]["title"], "items": [explanation]}]
    return _turn_payload(
        AgentDecision(scene=scene, explanation=explanation, views=views),
    )


def process_turn(text: str, current_scene: SceneId | None, from_menu: bool = False) -> TurnResponse:
    current = current_scene or store.current_scene
    heard = text.strip()
    _apply_dataset(detect_dataset(heard))
    nums = numeric_columns(store.df)
    names = list(store.df.columns)
    try:
        shown = match_show_scene(heard)
        if from_menu:
            decision = interpret_without_openai(
                heard,
                current,
                store.pca,
                nums,
                all_columns=names,
            )
        elif shown:
            decision = interpret_without_openai(
                heard,
                current,
                store.pca,
                nums,
                all_columns=names,
                forced_scene=shown,
            )
        else:
            decision = interpret_utterance(
                heard,
                current,
                store.pca,
                nums,
                source_name=store.source_name,
                all_columns=names,
                categoricals=categorical_columns(store.df),
                preview=preview_frame(store.df, 4),
            )
    except Exception as exc:  # noqa: BLE001
        decision = AgentDecision(
            scene="live",
            explanation=(
                f"모델 호출에 실패했습니다. ({exc}) "
                "목록에서 장면을 눌러 화면을 바꿔 보세요."
            ),
            views=[{"type": "bullets", "items": [heard]}],
        )
    _apply_dataset(decision.dataset)
    if decision.scene == "eigen_demo":
        _apply_dataset("height_weight")
    elif decision.scene == "iris_data":
        _apply_dataset("iris")
    elif decision.scene == "iris_cov_eigen":
        _apply_dataset("iris")
    elif decision.scene == "iris_pca_2d":
        _apply_dataset("iris")
    elif decision.scene == "iris_lda":
        _apply_dataset("iris")
    elif decision.scene == "summary":
        _apply_dataset("iris")
    store.current_scene = decision.scene
    return _turn_payload(decision, heard=heard)
