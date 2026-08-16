import { MainPage } from './main/MainPage';
import { NutritionPage } from './nutrition/NutritionPage';
import { NutritionRagPage } from './nutritionRag/NutritionRagPage';
import { YoloPage } from './yolo/YoloPage';
import { YoloPredictPage } from './yolo-predict/YoloPredictPage';

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