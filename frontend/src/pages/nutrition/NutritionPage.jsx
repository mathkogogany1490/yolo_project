import { FoodImagePicker } from '../../components/nutrition/FoodImagePicker/FoodImagePicker';
import { NutritionResult } from '../../components/nutrition/NutritionResult/NutritionResult';
import { GlassPanel } from '../../components/glass/GlassPanel.styles';
import { useAnalyzeFoodNutritionMutation } from '../../query/foodNutrition';
import { MainRoot } from '../main/MainPage.styles';

export function NutritionPage() {
    const analyze = useAnalyzeFoodNutritionMutation();

    return (
        <MainRoot>
            <GlassPanel>
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
