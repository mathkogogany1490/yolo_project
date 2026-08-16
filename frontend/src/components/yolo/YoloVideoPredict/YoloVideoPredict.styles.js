import styled from 'styled-components';

export const VideoStage = styled.div`
  position: relative;
  width: 100%;
  max-width: 960px;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
  line-height: 0;
`;

export const OverlayCanvas = styled.canvas`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
`;

export const LiveBadge = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${({ $on }) => ($on ? '#0f766e' : '#3d4f63')};
`;
