// YoloStepTabs.jsx
import { YOLO_STEPS } from '../yoloBoxUtils';
import { StepTab, StepTabs } from './YoloStepTabs.styles';

export function YoloStepTabs({ step, onStepChange }) {
    return (
        <StepTabs>
            {YOLO_STEPS.map((item) => (
                <StepTab
                    key={item.id}
                    type="button"
                    $active={step === item.id}
                    onClick={() => onStepChange(item.id)}
                >
                    {item.label}
                </StepTab>
            ))}
        </StepTabs>
    );
}
export default YoloStepTabs;