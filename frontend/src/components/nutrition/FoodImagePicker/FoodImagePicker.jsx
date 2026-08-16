import { useState } from 'react';
import {
    AnalyzeButton,
    FileInput,
    FileLabel,
    PickerRoot,
    Preview,
} from './FoodImagePicker.styles';

export function FoodImagePicker({ onAnalyze, loading = false }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');

    const onChange = (e) => {
        const next = e.target.files?.[0];
        if (!next) return;
        setFile(next);
        setPreview(URL.createObjectURL(next));
    };

    return (
        <PickerRoot>
            <FileLabel>
                이미지 선택
                <FileInput type="file" accept="image/*" onChange={onChange} />
            </FileLabel>
            {preview ? <Preview src={preview} alt="선택한 음식" /> : null}
            <AnalyzeButton
                type="button"
                disabled={!file || loading}
                onClick={() => onAnalyze?.(file)}
            >
                {loading ? '분석 중...' : '영양 분석'}
            </AnalyzeButton>
        </PickerRoot>
    );
}

export default FoodImagePicker;