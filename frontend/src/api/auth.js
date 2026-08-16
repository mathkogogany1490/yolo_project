import { apiRequest } from './client';

/**
 * POST /auth/register
 * body: { email, password }  // password min 8
 * → UserResponse { id, email, created_at }
 */
export function register(payload) {
    return apiRequest('/auth/register', {
        method: 'POST',
        body: {
            email: payload.email,
            password: payload.password,
        },
    });
}

/**
 * POST /auth/login
 * body: { email, password }
 * → TokenResponse { access_token, refresh_token, token_type }
 */
export function login(payload) {
    return apiRequest('/auth/login', {
        method: 'POST',
        body: {
            email: payload.email,
            password: payload.password,
        },
    });
}