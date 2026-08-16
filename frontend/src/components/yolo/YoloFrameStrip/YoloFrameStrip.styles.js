// YoloFrameStrip.styles.js
import styled from 'styled-components';

export const FrameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 8px;
`;
export const FrameThumb = styled.button`
  padding: 0;
  border: 2px solid
    ${({ $active, theme }) =>
    $active ? theme.colors.sidebarActiveText : theme.colors.glassBorder};
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  img {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }
`;