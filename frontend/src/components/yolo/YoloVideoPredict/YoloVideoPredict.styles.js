import styled from 'styled-components';

export const PredictRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const DropZone = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 220px;
  padding: 28px 20px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 2px dashed
    ${({ theme, $dragging }) =>
        $dragging ? theme.colors.accent : theme.colors.glassBorder};
  background: ${({ theme, $dragging }) =>
        $dragging ? theme.colors.accentBg : theme.colors.inputBg};
  backdrop-filter: blur(${({ theme }) => theme.blur.input});
  -webkit-backdrop-filter: blur(${({ theme }) => theme.blur.input});
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  box-shadow: ${({ $dragging, theme }) =>
        $dragging ? `0 0 0 4px ${theme.colors.accentBg}` : 'none'};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

export const HiddenFile = styled.input`
  display: none;
`;

export const DropIcon = styled.svg`
  width: 48px;
  height: 48px;
  color: ${({ theme }) => theme.colors.accent};
  flex-shrink: 0;
`;

export const DropHint = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textHeading};
  text-align: center;
`;

export const FileName = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  word-break: break-all;
`;

export const ControlRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-end;
`;

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
  align-self: center;
`;
