import { YoloVideoPredict } from '../../components/yolo';
import {
    Description,
    GlassPanel,
    PageRoot,
    Title,
} from '../yolo/YoloPage.styles';

export function YoloPredictPage() {
    return (
        <PageRoot>
            <GlassPanel>
                <Title>YOLO 영상 탐지</Title>
                <Description>
                    영상을 선택하면 바로 원본이 재생됩니다. 탐지 중에는 오버레이가 뜨고,
                    끝나면 best.pt로 박스가 그려진 결과 영상으로 전환됩니다. conf 기본 0.25.
                </Description>
                <YoloVideoPredict />
            </GlassPanel>
        </PageRoot>
    );
}

export default YoloPredictPage;
