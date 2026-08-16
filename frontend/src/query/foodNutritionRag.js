import { useMutation, useQuery } from '@tanstack/react-query';
import {
    analyzeFoodNutritionRag,
    getNutritionRagHealth,
} from '../api/foodNutritionRag';

export const nutritionRagKeys = {
    all: ['nutrition-rag'],
    health: () => [...nutritionRagKeys.all, 'health'],
    analyze: () => [...nutritionRagKeys.all, 'analyze'],
};

/**
 * GET /health
 * data: { status }
 */
export function useNutritionRagHealthQuery(options = {}) {
    return useQuery({
        queryKey: nutritionRagKeys.health(),
        queryFn: getNutritionRagHealth,
        ...options,
    });
}

/**
 * POST /nutrition/rag/analyze
 * variables: File
 * data: { food, score, seeds, answer, candidates }
 */
export function useAnalyzeFoodNutritionRagMutation(options = {}) {
    return useMutation({
        mutationKey: nutritionRagKeys.analyze(),
        mutationFn: (file) => analyzeFoodNutritionRag(file),
        ...options,
    });
}