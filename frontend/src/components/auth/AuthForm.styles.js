import styled, { css } from 'styled-components';

const jellyPrimary = css`
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primaryFrom} 0%,
    ${({ theme }) => theme.colors.primaryMid} 45%,
    ${({ theme }) => theme.colors.primaryTo} 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    0 8px 24px ${({ theme }) => theme.colors.primaryGlow};
`;

export const FormButton = styled.button`
  width: 100%;
  border-radius: ${({ theme }) => theme.radius.pill};
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  ${jellyPrimary}

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const AuthInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  border-radius: ${({ theme }) => theme.radius.pill};
  padding: 12px 18px;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textHeading};
  background: ${({ theme }) => theme.colors.inputBg};
  backdrop-filter: blur(${({ theme }) => theme.blur.input});
  -webkit-backdrop-filter: blur(${({ theme }) => theme.blur.input});
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.inputFocusBorder};
    box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.inputFocusRing};
  }
`;

export const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;