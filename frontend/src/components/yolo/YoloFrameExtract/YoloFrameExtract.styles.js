import styled from 'styled-components';

export const ExtractRoot = styled.section`
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
  cursor: ${({ $disabled }) => ($disabled ? 'wait' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.7 : 1)};
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  box-shadow: ${({ $dragging, theme }) =>
        $dragging ? `0 0 0 4px ${theme.colors.accentBg}` : 'none'};

  &:hover {
    border-color: ${({ theme, $disabled }) =>
        $disabled ? theme.colors.glassBorder : theme.colors.accent};
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

export const FrameCountRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-end;
`;
