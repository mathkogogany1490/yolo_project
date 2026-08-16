import { yoloFrameImageUrl } from '../../../api/yolo';
import { FrameGrid, FrameThumb } from './YoloFrameStrip.styles';

export function YoloFrameStrip({ sessionId, frames = [], selectedFrame = '', onSelectFrame }) {
    if (!sessionId || frames.length === 0) return null;
    return (
        <FrameGrid>
            {frames.map((frame) => (
                <FrameThumb
                    key={frame.filename}
                    type="button"
                    $active={selectedFrame === frame.filename}
                    onClick={() => onSelectFrame(frame.filename)}
                >
                    <img src={yoloFrameImageUrl(sessionId, frame.filename)} alt={frame.filename} />
                </FrameThumb>
            ))}
        </FrameGrid>
    );
}
export default YoloFrameStrip;