import { useMutation, useQuery } from '@tanstack/react-query';
import { analyzeFoodNutrition, getNutritionHealth } from '../api/foodNutrition';

export const nutritionKeys = {
    all: ['nutrition'],
    health: () => [...nutritionKeys.all, 'health'],
    analyze: () => [...nutritionKeys.all, 'analyze'],
};

/**
 * GET /health
 * data: { status }
 */
export function useNutritionHealthQuery(options = {}) {
    return useQuery({
        queryKey: nutritionKeys.health(),
        queryFn: getNutritionHealth,
        ...options,
    });
}

/**
 * POST /nutrition/analyze
 * variables: File
 * data: { food, confidence, nutrition, answer }
 */
export function useAnalyzeFoodNutritionMutation(options = {}) {
    return useMutation({
        mutationKey: nutritionKeys.analyze(),
        mutationFn: (file) => analyzeFoodNutrition(file),
        ...options,
    });
}