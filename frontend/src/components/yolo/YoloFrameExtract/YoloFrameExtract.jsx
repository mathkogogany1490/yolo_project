import { useRef } from 'react';
import { RowButton } from '../RowButton';
import {
    ErrorText, FieldLabel, HiddenFile, Hint, PanelSection, Row, SuccessText, TextInput,
} from '../shared.styles';

export function YoloFrameExtract({
                                     frameCount, onFrameCountChange, videoName = '', isPending = false,
                                     error = null, sessionId = '', frameTotal = 0, onVideoSelect,
                                 }) {
    const videoInputRef = useRef(null);
    return (
        <PanelSection>
            <Row>
                <FieldLabel>
                    균등 추출 프레임 수
                    <TextInput
                        type="number" min={1} max={500} value={frameCount}
                        onChange={(e) => onFrameCountChange(e.target.value)}
                    />
                </FieldLabel>
                <RowButton type="button" disabled={isPending} onClick={() => videoInputRef.current?.click()}>
                    {isPending ? '추출 중…' : '영상 선택 · 프레임 추출'}
                </RowButton>
                <HiddenFile
                    ref={videoInputRef} type="file" accept="video/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onVideoSelect?.(file);
                        e.target.value = '';
                    }}
                />
                <Hint>{videoName || 'mp4 / avi / mov / mkv'}</Hint>
            </Row>
            {error && <ErrorText>{error}</ErrorText>}
            {sessionId && (
                <SuccessText>세션 {sessionId} · {frameTotal}장 → ② 라벨링</SuccessText>
            )}
        </PanelSection>
    );
}
export default YoloFrameExtract;