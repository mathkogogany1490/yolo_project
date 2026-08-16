import styled from 'styled-components';

export const CanvasWrap = styled.div`
    position: relative;
    width: 100%;
    max-height: 420px;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(15, 23, 42, 0.08);
    cursor: crosshair;
    user-select: none;
    touch-action: none;

    img {
        display: block;
        width: 100%;
        max-height: 420px;
        object-fit: contain;
        pointer-events: none;
    }
`;

export const BoxLayer = styled.div`
    position: absolute;
    inset: 0;
    pointer-events: none;
`;

export const BoxRect = styled.div`
    position: absolute;
    border: 2px solid
    ${({ $draft, $editing, $selected }) =>
            $draft ? '#a855f7' : $editing || $selected ? '#f59e0b' : '#0f766e'};
    background: ${({ $draft, $editing, $selected }) =>
            $draft
                    ? 'rgba(168, 85, 247, 0.15)'
                    : $editing || $selected
                            ? 'rgba(245, 158, 11, 0.18)'
                            : 'rgba(15, 118, 110, 0.12)'};
    box-sizing: border-box;
    pointer-events: none;
`;

export const BoxLabel = styled.span`
    position: absolute;
    top: -20px;
    left: 0;
    padding: 1px 6px;
    font-size: 11px;
    background: rgba(15, 23, 42, 0.75);
    color: #fff;
    border-radius: 4px;
    white-space: nowrap;
`;