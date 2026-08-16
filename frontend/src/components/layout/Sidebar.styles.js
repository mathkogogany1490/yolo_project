import styled from 'styled-components';
import { glassCard } from '../../styles/glassCard';

export const Sidebar = styled.aside`
  width: 240px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${glassCard('default')}
  border-radius: ${({ theme }) => theme.radius.lg};
`;

export const SidebarTitle = styled.h2`
  margin: 0 0 8px;
  padding: 0 6px;
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textHeading};
`;

export const MenuLink = styled.a`
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.pill};
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  background: rgba(255, 255, 255, 0.18);

  &.active {
    color: ${({ theme }) => theme.colors.sidebarActiveText};
    background: linear-gradient(
      135deg,
      ${({ theme }) => theme.colors.sidebarActiveFrom},
      ${({ theme }) => theme.colors.sidebarActiveTo}
    );
    border: 1px solid ${({ theme }) => theme.colors.sidebarActiveBorder};
  }
`;