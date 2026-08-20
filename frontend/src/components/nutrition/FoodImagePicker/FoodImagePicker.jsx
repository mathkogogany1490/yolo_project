import { useEffect, useRef, useState } from 'react';
import {
    AnalyzeButton,
    DropHint,
    DropIcon,
    DropZone,
    FileInput,
    FileName,
    PickerRoot,
    Preview,
    PreviewWrap,
} from './FoodImagePicker.styles';

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

export function FoodImagePicker({
    onAnalyze,
    loading = false,
    analyzeLabel = '영양 분석',
    loadingLabel = '분석 중...',
}) {
    const inputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const applyFile = (next) => {
        if (!next || !next.type.startsWith('image/')) return;
        setFile(next);
        setPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(next);
        });
    };

    const onChange = (e) => {
        applyFile(e.target.files?.[0]);
        e.target.value = '';
    };

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        applyFile(e.dataTransfer.files?.[0]);
    };

    return (
        <PickerRoot>
            <DropZone
                $dragging={dragging}
                $hasPreview={Boolean(preview)}
                onClick={() => inputRef.current?.click()}
                onDragEnter={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setDragging(false);
                }}
                onDrop={onDrop}
            >
                <FileInput
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={onChange}
                />
                {preview ? (
                    <PreviewWrap>
                        <Preview src={preview} alt="선택한 음식" />
                    </PreviewWrap>
                ) : (
                    <>
                        <DownloadIcon />
                        <DropHint>이미지를 여기에 놓거나 클릭하여 가져오기</DropHint>
                    </>
                )}
            </DropZone>
            {file ? <FileName>{file.name}</FileName> : null}
            <AnalyzeButton
                type="button"
                disabled={!file || loading}
                onClick={() => onAnalyze?.(file)}
            >
                {loading ? loadingLabel : analyzeLabel}
            </AnalyzeButton>
        </PickerRoot>
    );
}

export default FoodImagePicker;
