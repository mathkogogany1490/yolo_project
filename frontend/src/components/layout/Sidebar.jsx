import { pageMenus } from '../../pages/menu';
import { MenuLink, Sidebar as SidebarRoot, SidebarTitle } from './Sidebar.styles';

export function Sidebar({
                            activePath = '/',
                            loggedIn = false,
                            onNavigate,
                            onRequireLogin,
                        }) {
    return (
        <SidebarRoot>
            <SidebarTitle>메뉴</SidebarTitle>
            {pageMenus.map((menu) => (
                <MenuLink
                    key={menu.id}
                    href={menu.path}
                    className={activePath === menu.path ? 'active' : undefined}
                    onClick={(e) => {
                        e.preventDefault();
                        if (menu.path !== '/' && !loggedIn) {
                            onRequireLogin?.(menu.path);
                            return;
                        }
                        onNavigate?.(menu.path);
                    }}
                >
                    {menu.label}
                </MenuLink>
            ))}
        </SidebarRoot>
    );
}