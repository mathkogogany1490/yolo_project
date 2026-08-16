import { GlassPanel } from '../../components/glass/GlassPanel.styles';
import { MainDesc, MainRoot, MainTitle } from './MainPage.styles';

export function MainPage() {
    return (
        <MainRoot>
            <GlassPanel>
                <MainTitle>MyHome</MainTitle>
                <MainDesc>
                    음식 이미지 영양 분석을 한곳에서 사용합니다.
                    로그인 후 왼쪽 메뉴에서 기능을 선택하세요.
                </MainDesc>
                <MainDesc style={{ marginTop: 16 }}>
                    영양 분석 · RAG 영양 평가
                </MainDesc>
            </GlassPanel>
        </MainRoot>
    );
}

export default MainPage;
