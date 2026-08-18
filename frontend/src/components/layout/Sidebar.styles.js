import styled from 'styled-components';
import { glassCard } from '../../styles/glassCard';

export const Sidebar = styled.aside`
  width: 240px;
  flex-shrink: 0;
  align-self: stretch;
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
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textHeading};
`;

export const MenuLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.pill};
  text-decoration: none;
  font-size: 15px;
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

export const MenuChevron = styled.span`
  flex-shrink: 0;
  color: inherit;
  font-size: 12px;
  transition: transform 0.18s ease;

  &.open {
    transform: rotate(90deg);
  }
`;

export const Submenu = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: -2px 0 6px;
  padding-left: 14px;
`;

export const SubmenuLink = styled.a`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 12px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  background: rgba(255, 255, 255, 0.12);

  &.active {
    color: ${({ theme }) => theme.colors.sidebarActiveText};
    background: rgba(45, 212, 191, 0.18);
    border: 1px solid ${({ theme }) => theme.colors.sidebarActiveBorder};
  }
`;