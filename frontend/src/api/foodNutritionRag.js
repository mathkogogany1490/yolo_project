import { API_BASE_URL } from './client';

/**
 * POST /nutrition/rag/analyze
 * body: FormData { file }
 * → { food, score, seeds, answer, candidates }
 */
export async function analyzeFoodNutritionRag(file) {
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`${API_BASE_URL}/nutrition/rag/analyze`, {
        method: 'POST',
        credentials: 'include',
        body: form,
    });

    if (!res.ok) {
        let detail = 'RAG 영양 평가에 실패했습니다.';
        try {
            const data = await res.json();
            detail =
                typeof data.detail === 'string'
                    ? data.detail
                    : Array.isArray(data.detail)
                        ? data.detail.map((d) => d.msg ?? JSON.stringify(d)).join(', ')
                        : detail;
        } catch {
            // ignore
        }
        const error = new Error(detail);
        error.status = res.status;
        throw error;
    }

    return res.json();
}

/**
 * GET /health
 * → { status }
 */
export function getNutritionRagHealth() {
    return fetch(`${API_BASE_URL}/health`, {
        credentials: 'include',
    }).then(async (res) => {
        if (!res.ok) throw new Error('health 확인에 실패했습니다.');
        return res.json();
    });
}