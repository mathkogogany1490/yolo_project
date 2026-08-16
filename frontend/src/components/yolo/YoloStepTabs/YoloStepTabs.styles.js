// YoloStepTabs.styles.js
import styled from 'styled-components';

export const StepTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

export const StepTab = styled.button`
  flex: 1;
  min-width: 120px;
  height: 38px;
  padding: 0 14px;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.sidebarActiveFrom : theme.colors.inputBg};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.sidebarActiveText : theme.colors.textHeading};
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
`;