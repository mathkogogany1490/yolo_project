import { FoodImagePicker } from '../../components/nutrition/FoodImagePicker/FoodImagePicker';
import { NutritionResult } from '../../components/nutrition/NutritionResult/NutritionResult';
import { GlassPanel } from '../../components/glass/GlassPanel.styles';
import {
    useAnalyzeFoodNutritionMutation,
    useNutritionHealthQuery,
} from '../../query/foodNutrition';
import { MainDesc, MainRoot, MainTitle } from '../main/MainPage.styles';

export function NutritionPage() {
    const health = useNutritionHealthQuery();
    const analyze = useAnalyzeFoodNutritionMutation();

    return (
        <MainRoot>
            <GlassPanel>
                <MainTitle>영양 분석</MainTitle>
                <MainDesc>
                    음식 이미지를 올리면 음식, 영양, OpenAI 대답을 보여 줍니다.
                    {health.data?.status ? ` (API: ${health.data.status})` : ''}
                </MainDesc>
                <FoodImagePicker
                    onAnalyze={(file) => analyze.mutate(file)}
                    loading={analyze.isPending}
                />
                <NutritionResult
                    data={analyze.data}
                    error={analyze.error}
                    loading={analyze.isPending}
                />
            </GlassPanel>
        </MainRoot>
    );
}

export default NutritionPage;