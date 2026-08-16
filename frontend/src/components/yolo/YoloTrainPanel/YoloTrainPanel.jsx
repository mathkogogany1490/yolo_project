import { RowButton } from '../RowButton';
import {
    ErrorText,
    FieldLabel,
    Hint,
    PanelSection,
    Row,
    Select,
    SuccessText,
    TextInput,
} from '../shared.styles';
import { ResultBox } from './YoloTrainPanel.styles';

const PRESET_EPOCHS = [5, 10, 20, 30, 50, 100];
const DEVICE_OPTIONS = [
    { value: 'auto', label: 'auto (GPU 있으면 cuda)' },
    { value: 'cuda', label: 'cuda (GPU)' },
    { value: 'cpu', label: 'cpu' },
];

export function YoloTrainPanel({
                                   sessionId = '',
                                   epochs,
                                   onEpochsChange,
                                   device = 'auto',
                                   onDeviceChange,
                                   isPending = false,
                                   error = null,
                                   result = null,
                                   onTrain,
                               }) {
    const epochValue = Number(epochs) || 10;
    const isPreset = PRESET_EPOCHS.includes(epochValue);
    const selectValue = isPreset ? String(epochValue) : 'custom';

    return (
        <PanelSection>
            <Row>
                <FieldLabel>
                    훈련 epoch 선택
                    <Select
                        value={selectValue}
                        disabled={isPending}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value !== 'custom') onEpochsChange(Number(value));
                        }}
                    >
                        {PRESET_EPOCHS.map((n) => (
                            <option key={n} value={n}>
                                {n} epochs
                            </option>
                        ))}
                        <option value="custom">직접 입력</option>
                    </Select>
                </FieldLabel>
                {!isPreset && (
                    <FieldLabel>
                        epoch (1–500)
                        <TextInput
                            type="number"
                            min={1}
                            max={500}
                            value={epochs}
                            disabled={isPending}
                            onChange={(e) => onEpochsChange(e.target.value)}
                        />
                    </FieldLabel>
                )}
                <FieldLabel>
                    GPU / device
                    <Select
                        value={device}
                        disabled={isPending}
                        onChange={(e) => onDeviceChange?.(e.target.value)}
                    >
                        {DEVICE_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </Select>
                </FieldLabel>
                <Hint>세션: {sessionId || '라벨이 있는 모든 세션'}</Hint>
                <RowButton type="button" disabled={isPending} onClick={onTrain}>
                    {isPending ? '훈련 중…' : `YOLO 훈련 시작 (${epochValue} epochs)`}
                </RowButton>
            </Row>
            {error && <ErrorText>{error}</ErrorText>}
            {result && (
                <>
                    <SuccessText>모델이 저장되었습니다. ({result.epochs} epochs)</SuccessText>
                    <ResultBox>
                        {`job_id: ${result.job_id}\n`}
                        {`epochs: ${result.epochs}\n`}
                        {`train_images: ${result.train_images}\n`}
                        {`val_images: ${result.val_images}\n`}
                        {`checkpoint: ${result.checkpoint_path}\n`}
                        {`device: ${result.device}`}
                    </ResultBox>
                </>
            )}
        </PanelSection>
    );
}

export default YoloTrainPanel;