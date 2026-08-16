import styled from 'styled-components';
import { glassCard } from '../../styles/glassCard';

export const PageRoot = styled.div`
  flex: 1;
  background: transparent;
  padding: ${({ theme }) => theme.space.page};
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const GlassPanel = styled.section`
  width: 100%;
  ${glassCard('detail')}
  padding: 28px;
`;

export const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 28px;
  color: ${({ theme }) => theme.colors.textHeading};
`;

export const Description = styled.p`
  margin: 0 0 16px;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.5;
`;

export const StepTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

export const StepTab = styled.button`
  border-radius: ${({ theme }) => theme.radius.pill};
  padding: 8px 14px;
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.sidebarActiveFrom : theme.colors.inputBg};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.sidebarActiveText : theme.colors.text};
  font-weight: 700;
  cursor: pointer;
`;

export const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin: 8px 0;
`;

export const Field = styled.input`
  border-radius: ${({ theme }) => theme.radius.pill};
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
  background: ${({ theme }) => theme.colors.inputBg};
`;

export const PrimaryButton = styled.button`
  border-radius: ${({ theme }) => theme.radius.pill};
  padding: 10px 16px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primaryFrom},
    ${({ theme }) => theme.colors.primaryTo}
  );
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.deleteTo};
  font-size: 13px;
`;

export const Hint = styled.p`
  margin: 8px 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
`;

export const Pre = styled.pre`
  white-space: pre-wrap;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  padding: 12px;
  border-radius: 12px;
`;