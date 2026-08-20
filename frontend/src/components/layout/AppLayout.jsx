import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthModal } from '../auth/AuthModal';
import { clearTokens, isLoggedIn } from '../../api/token';
import { ContentArea, ContentViewport, LayoutBody, LayoutRoot } from './AppLayout.styles';
import { HeaderBar } from './HeaderBar';
import { Sidebar } from './Sidebar';

export function AppLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [authMode, setAuthMode] = useState(null);
    const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
    const [pendingPath, setPendingPath] = useState(null);

    const openLogin = () => setAuthMode('login');

    return (
        <LayoutRoot>
            <HeaderBar
                loggedIn={loggedIn}
                onLogin={openLogin}
                onRegister={() => setAuthMode('register')}
                onHome={() => navigate('/')}
                onLogout={() => {
                    clearTokens();
                    setLoggedIn(false);
                    navigate('/', { replace: true });
                }}
            />
            <LayoutBody>
                <Sidebar
                    activePath={location.pathname}
                    activeSearch={location.search}
                    loggedIn={loggedIn}
                    onRequireLogin={(path) => {
                        setPendingPath(path);
                        openLogin();
                    }}
                    onNavigate={(path) => navigate(path)}
                />
                <ContentArea>
                    <ContentViewport>
                        <Outlet context={{ loggedIn, openLogin }} />
                    </ContentViewport>
                </ContentArea>
            </LayoutBody>

            {authMode ? (
                <AuthModal
                    mode={authMode}
                    onClose={() => {
                        setAuthMode(null);
                        setPendingPath(null);
                    }}
                    onSuccess={() => {
                        setLoggedIn(true);
                        if (pendingPath) {
                            navigate(pendingPath);
                            setPendingPath(null);
                        }
                    }}
                />
            ) : null}
        </LayoutRoot>
    );
}