/**
 * API base URL
 * - default: http://127.0.0.1:8002
 * - override: VITE_API_URL
 */
export const API_BASE_URL =
    import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export async function apiRequest(path, options = {}) {
    const { method = 'GET', body, token, headers = {} } = options;
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
            Accept: 'application/json',
            // FormData면 Content-Type 넣지 않음 (boundary 자동)
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        credentials: 'include',
        body: isFormData ? body : body != null ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let detail = '요청에 실패했습니다.';
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
        error.detail = detail;
        throw error;
    }

    if (res.status === 204) return null;
    return res.json();
}

export default apiRequest;