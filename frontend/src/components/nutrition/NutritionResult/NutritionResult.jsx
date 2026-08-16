import {
    NutriList,
    ResultRoot,
    ResultText,
    ResultTitle,
} from './NutritionResult.styles';

export function NutritionResult({ data, error, loading = false }) {
    if (loading) {
        return (
            <ResultRoot>
                <ResultText>이미지를 분석하고 있습니다.</ResultText>
            </ResultRoot>
        );
    }

    if (error) {
        return (
            <ResultRoot>
                <ResultText>{error.message || '분석에 실패했습니다.'}</ResultText>
            </ResultRoot>
        );
    }

    if (!data) return null;

    const { food, confidence, nutrition, answer } = data;

    return (
        <ResultRoot>
            <ResultTitle>
                {food} ({(confidence * 100).toFixed(1)}%)
            </ResultTitle>
            <NutriList>
                <li>칼로리: {nutrition.calories} kcal</li>
                <li>단백질: {nutrition.protein} g</li>
                <li>지방: {nutrition.fat} g</li>
                <li>탄수화물: {nutrition.carbohydrates} g</li>
            </NutriList>
            <ResultText>{answer}</ResultText>
        </ResultRoot>
    );
}

export default NutritionResult;