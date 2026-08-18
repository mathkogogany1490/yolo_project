import { MainPage } from './main/MainPage';
import { NutritionPage } from './nutrition/NutritionPage';
import { NutritionRagPage } from './nutritionRag/NutritionRagPage';
import { LectureRagPage } from './lectureRag/LectureRagPage';
import { YoloPage } from './yolo/YoloPage';
import { YoloPredictPage } from './yolo-predict/YoloPredictPage';

export const lectureSceneMenus = [
    { id: 'intro', label: '01. PCA(주성분분석)란' },
    { id: 'eigen_demo', label: '02. 고유값과 고유벡터' },
    { id: 'iris_data', label: '03. Iris(붓꽃) 데이터' },
    { id: 'iris_cov_eigen', label: '04. Min-Max · 공분산 · 고유값' },
    { id: 'iris_pca_2d', label: '05. 4차원 → 2차원 선형변환' },
    { id: 'iris_lda', label: '06. LDA(선형판별분석)' },
    { id: 'summary', label: '07. 요약정리' },
];

/**
 * Sidebar / Routes 자동 반영
 * { id, path, label, element } 추가 시 메뉴·라우팅에 반영
 */
export const pageMenus = [
    {
        id: 'main',
        path: '/',
        label: '나의 홈페이지',
        element: MainPage,
    },
    {
        id: 'nutrition',
        path: '/nutrition',
        label: '영양 분석',
        element: NutritionPage,
    },
    {
        id: 'nutrition-rag',
        path: '/nutrition-rag',
        label: 'RAG 영양 평가',
        element: NutritionRagPage,
    },
    {
        id: 'lecture-rag',
        path: '/lecture-rag',
        label: 'PCA 강의 RAG',
        element: LectureRagPage,
        children: lectureSceneMenus,
    },
    {
        id: 'yolo',
        path: '/yolo',
        label: 'YOLO 탐지',
        element: YoloPage,
    },
    {
        id: 'yolo-predict',
        path: '/yolo-predict',
        label: 'YOLO 영상 예측',
        element: YoloPredictPage,
    },
];

export default pageMenus;