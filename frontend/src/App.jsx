import { Navigate, Route, Routes, useOutletContext } from 'react-router-dom';
import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { pageMenus } from './pages/menu';

function RequireAuth({ children }) {
    const { loggedIn, openLogin } = useOutletContext();

    useEffect(() => {
        if (!loggedIn) openLogin();
    }, [loggedIn, openLogin]);

    if (!loggedIn) return <Navigate to="/" replace />;
    return children;
}

function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                {pageMenus.map((menu) => {
                    const Page = menu.element;
                    const element =
                        menu.path === '/' ? (
                            <Page />
                        ) : (
                            <RequireAuth>
                                <Page />
                            </RequireAuth>
                        );
                    return <Route key={menu.id} path={menu.path} element={element} />;
                })}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

export default App;