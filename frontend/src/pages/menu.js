import { MainPage } from './main/MainPage';
import { NutritionPage } from './nutrition/NutritionPage';
import { NutritionRagPage } from './nutritionRag/NutritionRagPage';
import { LectureRagPage } from './lectureRag/LectureRagPage';
import { YoloPage } from './yolo/YoloPage';

export const pcaSceneMenus = [
    { id: 'intro', label: '01. PCA(주성분분석)란' },
    { id: 'eigen_demo', label: '02. 고유값과 고유벡터' },
    { id: 'iris_data', label: '03. Iris(붓꽃) 데이터' },
    { id: 'iris_cov_eigen', label: '04. 붓꽃의 공분산과 고윳값 및 고유벡터' },
    { id: 'iris_pca_2d', label: '05. 차원 축소 선형 변환(PCA)' },
    { id: 'iris_lda', label: '06. LDA(선형판별분석)' },
    { id: 'summary', label: '07. 요약정리' },
];

export const svdSceneMenus = [
    { id: 'svd_intro', label: '01. SVD(특이값분해)란' },
    { id: 'svd_ratings', label: '02. 영화 평점 데이터' },
    { id: 'svd_decompose', label: '03. 영화 행렬 분해' },
    { id: 'svd_summary', label: '04. 요약정리' },
];

export const mfSceneMenus = [
    { id: 'mf_intro', label: '01. MF(행렬분해)란' },
    { id: 'mf_embedding', label: '02. 임베딩이란' },
    { id: 'mf_ratings', label: '03. 영화 평점 데이터' },
    { id: 'mf_model', label: '04. MF 딥러닝 계산' },
    { id: 'mf_training', label: '05. 딥러닝 구조도' },
    { id: 'mf_summary', label: '06. 요약정리' },
];

export const transformerSceneMenus = [
    { id: 'tf_intro', label: '01. Transformer란' },
    { id: 'tf_attention', label: '02. QUERY, KEY' },
    { id: 'tf_multihead', label: '03. Attention, VALUE' },
    { id: 'tf_encoder', label: '04. Embedding' },
    { id: 'tf_diagram', label: '05. 구조도' },
    { id: 'tf_summary', label: '06. 요약정리' },
];

/** @deprecated use pcaSceneMenus */
export const lectureSceneMenus = pcaSceneMenus;

export const yoloSceneMenus = [
    { id: 'detect-train', label: '탐지 및 훈련' },
    { id: 'predict', label: '영상 예측' },
];

export const pageMenus = [
    {
        id: 'main',
        path: '/',
        label: '나의 홈페이지',
        element: MainPage,
        hideFromSidebar: true,
    },
    {
        id: 'image-model',
        path: '/nutrition',
        label: '이미지 모델',
        children: [
            {
                id: 'nutrition',
                path: '/nutrition',
                label: '영양 평가',
                element: NutritionPage,
            },
            {
                id: 'nutrition-rag',
                path: '/nutrition-rag',
                label: '영양 평가(RAG)',
                element: NutritionRagPage,
            },
        ],
    },
    {
        id: 'yolo',
        path: '/yolo',
        label: 'YOLO',
        element: YoloPage,
        children: yoloSceneMenus,
    },
    {
        id: 'lecture-rag',
        path: '/lecture-rag',
        label: '머신러닝 강의',
        element: LectureRagPage,
        children: [
            {
                id: 'pca',
                label: 'PCA 강의',
                children: pcaSceneMenus,
            },
            {
                id: 'svd',
                label: 'SVD 강의',
                children: svdSceneMenus,
            },
            {
                id: 'mf',
                label: 'MF 강의',
                children: mfSceneMenus,
            },
            {
                id: 'transformer',
                label: 'Transformer 강의',
                children: transformerSceneMenus,
            },
        ],
    },
];

/** Flatten pageMenus into routable entries (top-level + nested path pages). */
export function getRouteMenus(menus = pageMenus) {
    const routes = [];
    for (const menu of menus) {
        if (menu.element && menu.path) {
            routes.push(menu);
        }
        if (menu.children?.length) {
            for (const child of menu.children) {
                if (child.element && child.path) {
                    routes.push(child);
                }
            }
        }
    }
    return routes;
}

export default pageMenus;
