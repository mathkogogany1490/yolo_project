import { GlassPanel } from '../../components/glass/GlassPanel.styles';
import { MainHero, MainRoot } from './MainPage.styles';

export function MainPage() {
    return (
        <MainRoot>
            <GlassPanel>
                <MainHero
                    src="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1200"
                    alt="컴퓨터 소프트웨어와 함께하는 AI 로봇"
                />
            </GlassPanel>
        </MainRoot>
    );
}

export default MainPage;