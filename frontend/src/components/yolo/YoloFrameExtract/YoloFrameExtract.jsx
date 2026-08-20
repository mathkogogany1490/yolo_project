import { useRef, useState } from 'react';
import { RowButton } from '../RowButton';
import { ErrorText, FieldLabel, SuccessText, TextInput } from '../shared.styles';
import {
    DropHint,
    DropIcon,
    DropZone,
    ExtractRoot,
    FileName,
    FrameCountRow,
    HiddenFile,
} from './YoloFrameExtract.styles';

function DownloadIcon() {
    return (
        <DropIcon viewBox="0 0 48 48" aria-hidden="true">
            <path
                d="M24 6v24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M16 22l8 8 8-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10 36h28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M8 42h32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
        </DropIcon>
    );
}

export function YoloFrameExtract({
    frameCount,
    onFrameCountChange,
    videoName = '',
    isPending = false,
    error = null,
    sessionId = '',
    frameTotal = 0,
    onVideoSelect,
}) {
    const videoInputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const applyFile = (file) => {
        if (!file || !file.type.startsWith('video/')) return;
        onVideoSelect?.(file);
    };

    return (
        <ExtractRoot>
            <DropZone
                $dragging={dragging}
                $disabled={isPending}
                onClick={() => {
                    if (!isPending) videoInputRef.current?.click();
                }}
                onDragEnter={(e) => {
                    e.preventDefault();
                    if (!isPending) setDragging(true);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!isPending) setDragging(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setDragging(false);
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    if (isPending) return;
                    applyFile(e.dataTransfer.files?.[0]);
                }}
            >
                <HiddenFile
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                        applyFile(e.target.files?.[0]);
                        e.target.value = '';
                    }}
                />
                <DownloadIcon />
                <DropHint>
                    {isPending
                        ? '프레임 추출 중…'
                        : '영상을 여기에 놓거나 클릭하여 가져오기'}
                </DropHint>
            </DropZone>

            {videoName ? <FileName>{videoName}</FileName> : null}

            <FrameCountRow>
                <FieldLabel>
                    균등 추출 프레임 수
                    <TextInput
                        type="number"
                        min={1}
                        max={500}
                        value={frameCount}
                        disabled={isPending}
                        onChange={(e) => onFrameCountChange(e.target.value)}
                    />
                </FieldLabel>
                <RowButton
                    type="button"
                    disabled={isPending}
                    onClick={() => videoInputRef.current?.click()}
                >
                    {isPending ? '추출 중…' : '영상 선택'}
                </RowButton>
            </FrameCountRow>

            {error ? <ErrorText>{error}</ErrorText> : null}
            {sessionId ? (
                <SuccessText>
                    세션 {sessionId} · {frameTotal}장
                </SuccessText>
            ) : null}
        </ExtractRoot>
    );
}

export default YoloFrameExtract;
