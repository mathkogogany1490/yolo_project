import styled from 'styled-components';
import { glassCard } from '../../styles/glassCard';

export const HeaderBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  padding: 12px 16px;
  ${glassCard('default')}
  border-radius: ${({ theme }) => theme.radius.lg};
`;

export const HeaderTitle = styled.a`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textHeading};
  text-decoration: none;
  cursor: pointer;

  &:hover {
    opacity: 0.85;
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const HeaderButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
  border-radius: ${({ theme }) => theme.radius.pill};
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textHeading};
  background: ${({ theme }) => theme.colors.inputBg};
  backdrop-filter: blur(${({ theme }) => theme.blur.input});
  -webkit-backdrop-filter: blur(${({ theme }) => theme.blur.input});
`;