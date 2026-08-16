import { useMutation } from '@tanstack/react-query';
import { login, register } from '../../api/auth';
import { authKeys } from '../keys';

/**
 * POST /auth/register
 * variables: { email, password }
 * data: { id, email, created_at }
 */
export function useRegisterMutation(options = {}) {
    return useMutation({
        mutationKey: authKeys.register(),
        mutationFn: (payload) => register(payload),
        ...options,
    });
}

/**
 * POST /auth/login
 * variables: { email, password }
 * data: { access_token, refresh_token, token_type }
 */
export function useLoginMutation(options = {}) {
    return useMutation({
        mutationKey: authKeys.login(),
        mutationFn: (payload) => login(payload),
        ...options,
    });
}