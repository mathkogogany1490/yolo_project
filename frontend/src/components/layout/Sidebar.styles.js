import styled from 'styled-components';
import { glassCard } from '../../styles/glassCard';

export const Sidebar = styled.aside`
  grid-column: 1;
  grid-row: 1;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  box-sizing: border-box;
  ${glassCard('default')}
  border-radius: ${({ theme }) => theme.radius.lg};
`;

export const SidebarTitle = styled.h2`
  margin: 0;
  padding: 0 6px 4px;
  flex-shrink: 0;
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textHeading};
`;

export const MenuScroll = styled.nav`
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 2px;
  overscroll-behavior: contain;
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
  border: 1px solid transparent;
  flex-shrink: 0;

  &.active {
    color: ${({ theme }) => theme.colors.sidebarActiveText};
    background: linear-gradient(
      135deg,
      ${({ theme }) => theme.colors.sidebarActiveFrom},
      ${({ theme }) => theme.colors.sidebarActiveTo}
    );
    border-color: ${({ theme }) => theme.colors.sidebarActiveBorder};
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
  flex-shrink: 0;
`;

export const SubmenuLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid transparent;
  flex-shrink: 0;

  &.active {
    color: ${({ theme }) => theme.colors.sidebarActiveText};
    background: rgba(45, 212, 191, 0.18);
    border-color: ${({ theme }) => theme.colors.sidebarActiveBorder};
  }
`;

export const NestedSubmenuLink = styled(SubmenuLink)`
  margin-left: 14px;
  font-size: 13px;
  padding: 7px 12px;
`;
