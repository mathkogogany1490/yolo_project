import {
    CandidateTitle,
    NutriList,
    ResultRoot,
    ResultText,
    ResultTitle,
} from './NutritionRagResult.styles';

function SeedsList({ seeds }) {
    if (!seeds) return <ResultText>seeds 없음</ResultText>;
    return (
        <NutriList>
            <li>칼로리: {seeds.calories} kcal</li>
            <li>단백질: {seeds.protein} g</li>
            <li>지방: {seeds.fat} g</li>
            <li>탄수화물: {seeds.carbohydrates} g</li>
        </NutriList>
    );
}

export function NutritionRagResult({ data, error, loading = false }) {
    if (loading) {
        return (
            <ResultRoot>
                <ResultText>RAG로 비슷한 음식을 찾고 있습니다.</ResultText>
            </ResultRoot>
        );
    }

    if (error) {
        return (
            <ResultRoot>
                <ResultText>{error.message || 'RAG 평가에 실패했습니다.'}</ResultText>
            </ResultRoot>
        );
    }

    if (!data) return null;

    const { food, score, seeds, answer, candidates = [] } = data;

    return (
        <ResultRoot>
            <ResultTitle>
                {food} (유사도 {(score * 100).toFixed(1)}%)
            </ResultTitle>
            <SeedsList seeds={seeds} />
            <ResultText>{answer}</ResultText>
            <CandidateTitle>RAG 후보</CandidateTitle>
            <NutriList>
                {candidates.map((item) => (
                    <li key={`${item.food}-${item.score}`}>
                        {item.food} · 유사도 {(item.score * 100).toFixed(1)}%
                        {item.seeds
                            ? ` · ${item.seeds.calories}kcal`
                            : ''}
                    </li>
                ))}
            </NutriList>
        </ResultRoot>
    );
}

export default NutritionRagResult;