import { FoodImagePicker } from '../../components/nutritionRag/FoodImagePicker/FoodImagePicker';
import { NutritionRagResult } from '../../components/nutritionRag/NutritionRagResult/NutritionRagResult';
import { GlassPanel } from '../../components/glass/GlassPanel.styles';
import {
    useAnalyzeFoodNutritionRagMutation,
    useNutritionRagHealthQuery,
} from '../../query/foodNutritionRag';
import { MainDesc, MainRoot, MainTitle } from '../main/MainPage.styles';

export function NutritionRagPage() {
    const health = useNutritionRagHealthQuery();
    const analyze = useAnalyzeFoodNutritionRagMutation();

    return (
        <MainRoot>
            <GlassPanel>
                <MainTitle>RAG 영양 평가</MainTitle>
                <MainDesc>
                    음식 이미지를 올리면 CLIP RAG로 비슷한 음식을 찾아 영양을 보여 줍니다.
                    {health.data?.status ? ` (API: ${health.data.status})` : ''}
                </MainDesc>
                <FoodImagePicker
                    onAnalyze={(file) => analyze.mutate(file)}
                    loading={analyze.isPending}
                />
                <NutritionRagResult
                    data={analyze.data}
                    error={analyze.error}
                    loading={analyze.isPending}
                />
            </GlassPanel>
        </MainRoot>
    );
}

export default NutritionRagPage;