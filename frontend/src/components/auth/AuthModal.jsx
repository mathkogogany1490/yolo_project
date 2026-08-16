import { useState } from 'react';
import { useLoginMutation, useRegisterMutation } from '../../query/hooks/useAuth';
import { saveTokens } from '../../api/token';
import { AuthForm, AuthInput, FormButton } from './AuthForm.styles';
import {
    ModalCard,
    ModalClose,
    ModalError,
    ModalHeader,
    ModalOverlay,
    ModalTitle,
} from './AuthModal.styles';

export function AuthModal({ mode = 'login', onClose, onSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const isLogin = mode === 'login';

    const loginMutation = useLoginMutation({
        onSuccess: (token) => {
            saveTokens(token);
            onSuccess?.(token);
            onClose?.();
        },
        onError: (err) => setError(err.message || '로그인 실패'),
    });

    const registerMutation = useRegisterMutation({
        onSuccess: async () => {
            try {
                await loginMutation.mutateAsync({ email, password });
            } catch (err) {
                setError(err.message || '가입 후 로그인 실패');
            }
        },
        onError: (err) => setError(err.message || '회원가입 실패'),
    });

    const pending = loginMutation.isPending || registerMutation.isPending;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim()) return setError('이메일을 입력해 주세요.');
        if (!isLogin && password.length < 8) {
            return setError('비밀번호는 8자 이상이어야 합니다.');
        }
        if (!password) return setError('비밀번호를 입력해 주세요.');

        const payload = { email: email.trim(), password };
        if (isLogin) loginMutation.mutate(payload);
        else registerMutation.mutate(payload);
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalCard onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>{isLogin ? 'Login' : 'Register'}</ModalTitle>
                    <ModalClose type="button" onClick={onClose}>
                        ×
                    </ModalClose>
                </ModalHeader>
                <AuthForm onSubmit={handleSubmit}>
                    <AuthInput
                        type="email"
                        placeholder="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <AuthInput
                        type="password"
                        placeholder={isLogin ? 'password' : 'password (8자 이상)'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={isLogin ? undefined : 8}
                    />
                    {error ? <ModalError>{error}</ModalError> : null}
                    <FormButton type="submit" disabled={pending}>
                        {pending ? '처리 중...' : isLogin ? 'Login' : 'Register'}
                    </FormButton>
                </AuthForm>
            </ModalCard>
        </ModalOverlay>
    );
}