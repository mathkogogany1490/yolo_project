import { RowButton } from '../RowButton';
import { ErrorText, FieldLabel, Hint, Row, SuccessText, TextInput } from '../shared.styles';
import { ChipButton, ChipDeleteButton, ChipItem, ChipList } from './YoloLabelPicker.styles';

export function YoloLabelPicker({
                                    labelName = '', onLabelNameChange, onRegister, isRegistering = false,
                                    registerError = null, registeredLabels = [], activeLabelName = '',
                                    onActiveLabelChange, onDeleteLabel, deletingLabelId = null,
                                }) {
    return (
        <>
            <Row>
                <FieldLabel>
                    새 라벨 이름
                    <TextInput
                        value={labelName} placeholder="예: fire" disabled={isRegistering}
                        onChange={(e) => onLabelNameChange(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onRegister?.(); } }}
                    />
                </FieldLabel>
                <RowButton type="button" disabled={isRegistering} onClick={onRegister}>
                    {isRegistering ? '등록 중…' : '라벨 등록'}
                </RowButton>
            </Row>
            {registerError && <ErrorText>{registerError}</ErrorText>}
            {registeredLabels.length > 0 && (
                <>
                    <Hint>칩 선택 후 캔버스 드래그. × 로 삭제</Hint>
                    <ChipList>
                        {registeredLabels.map((label) => (
                            <ChipItem key={label.id} $active={activeLabelName === label.name}>
                                <ChipButton type="button" onClick={() => onActiveLabelChange(label.name)}>
                                    {label.name}
                                </ChipButton>
                                <ChipDeleteButton
                                    type="button"
                                    disabled={deletingLabelId === label.id}
                                    onClick={() => onDeleteLabel?.(label)}
                                >
                                    ×
                                </ChipDeleteButton>
                            </ChipItem>
                        ))}
                    </ChipList>
                    {activeLabelName && <SuccessText>현재 라벨: {activeLabelName}</SuccessText>}
                </>
            )}
        </>
    );
}
export default YoloLabelPicker;