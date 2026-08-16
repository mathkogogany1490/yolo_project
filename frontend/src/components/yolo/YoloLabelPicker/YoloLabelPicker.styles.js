// YoloLabelPicker.styles.js
import styled from 'styled-components';

export const ChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;
export const ChipItem = styled.div`
  display: inline-flex;
  align-items: center;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px solid
    ${({ $active, theme }) =>
    $active ? theme.colors.sidebarActiveBorder : theme.colors.glassBorder};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.sidebarActiveFrom : theme.colors.inputBg};
  overflow: hidden;
`;
export const ChipButton = styled.button`
  height: 38px;
  padding: 0 4px 0 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 600;
`;
export const ChipDeleteButton = styled.button`
  height: 38px;
  padding: 0 10px 0 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  opacity: 0.7;
`;