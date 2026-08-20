import { FoodImagePicker } from '../../components/nutrition/FoodImagePicker/FoodImagePicker';
import { NutritionRagResult } from '../../components/nutritionRag/NutritionRagResult/NutritionRagResult';
import { GlassPanel } from '../../components/glass/GlassPanel.styles';
import { useAnalyzeFoodNutritionRagMutation } from '../../query/foodNutritionRag';
import { MainRoot } from '../main/MainPage.styles';

export function NutritionRagPage() {
    const analyze = useAnalyzeFoodNutritionRagMutation();

    return (
        <MainRoot>
            <GlassPanel>
                <FoodImagePicker
                    onAnalyze={(file) => analyze.mutate(file)}
                    loading={analyze.isPending}
                    analyzeLabel="RAG 평가"
                    loadingLabel="검색 중..."
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
