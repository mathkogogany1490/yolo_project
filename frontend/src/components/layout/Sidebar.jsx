import { useEffect, useState } from 'react';
import { pageMenus } from '../../pages/menu';
import { MenuChevron, MenuLink, Sidebar as SidebarRoot, SidebarTitle, Submenu, SubmenuLink } from './Sidebar.styles';

export function Sidebar({
                            activePath = '/',
                            activeSearch = '',
                            loggedIn = false,
                            onNavigate,
                            onRequireLogin,
                        }) {
    const activeScene = new URLSearchParams(activeSearch).get('scene');
    const [openMenus, setOpenMenus] = useState(() =>
        Object.fromEntries(pageMenus.filter((menu) => menu.children?.length).map((menu) => [menu.id, false])),
    );

    useEffect(() => {
        const activeMenu = pageMenus.find((menu) => menu.path === activePath && menu.children?.length);
        if (!activeMenu) return;
        setOpenMenus((current) => (current[activeMenu.id] ? current : { ...current, [activeMenu.id]: true }));
    }, [activePath]);

    return (
        <SidebarRoot>
            <SidebarTitle>메뉴</SidebarTitle>
            {pageMenus.map((menu) => {
                const isActive = activePath === menu.path;
                const hasChildren = Boolean(menu.children?.length);
                const isOpen = Boolean(openMenus[menu.id]);

                return (
                    <div key={menu.id}>
                        <MenuLink
                            href={menu.path}
                            className={isActive ? 'active' : undefined}
                            onClick={(e) => {
                                e.preventDefault();
                                if (menu.path !== '/' && !loggedIn) {
                                    onRequireLogin?.(menu.path);
                                    return;
                                }
                                if (hasChildren) {
                                    setOpenMenus((current) => ({
                                        ...current,
                                        [menu.id]: isActive ? !current[menu.id] : true,
                                    }));
                                }
                                onNavigate?.(menu.path);
                            }}
                        >
                            {menu.label}
                            {hasChildren ? (
                                <MenuChevron className={isOpen ? 'open' : undefined}>▶</MenuChevron>
                            ) : null}
                        </MenuLink>
                        {isActive && hasChildren && isOpen ? (
                            <Submenu>
                                {menu.children.map((child) => (
                                    <SubmenuLink
                                        key={child.id}
                                        href={`${menu.path}?scene=${child.id}`}
                                        className={activeScene === child.id ? 'active' : undefined}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onNavigate?.(`${menu.path}?scene=${child.id}`);
                                        }}
                                    >
                                        {child.label}
                                    </SubmenuLink>
                                ))}
                            </Submenu>
                        ) : null}
                    </div>
                );
            })}
        </SidebarRoot>
    );
}