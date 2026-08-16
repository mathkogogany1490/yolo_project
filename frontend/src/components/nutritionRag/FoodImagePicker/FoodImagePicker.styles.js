import styled from 'styled-components';
import { FormButton } from '../../auth/AuthForm.styles';

export const PickerRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const FileLabel = styled.label`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  border-radius: ${({ theme }) => theme.radius.pill};
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textHeading};
  background: ${({ theme }) => theme.colors.inputBg};
  backdrop-filter: blur(${({ theme }) => theme.blur.input});
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
  cursor: pointer;
`;

export const FileInput = styled.input`
  display: none;
`;

export const Preview = styled.img`
  width: 100%;
  max-width: 360px;
  max-height: 240px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
`;

export const AnalyzeButton = styled(FormButton)`
  width: fit-content;
  min-width: 140px;
`;