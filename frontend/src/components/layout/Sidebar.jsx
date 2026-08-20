import { useEffect, useState } from 'react';
import { pageMenus } from '../../pages/menu';
import {
    MenuChevron,
    MenuLink,
    MenuScroll,
    NestedSubmenuLink,
    Sidebar as SidebarRoot,
    SidebarTitle,
    Submenu,
    SubmenuLink,
} from './Sidebar.styles';

function isMenuActive(menu, activePath) {
    if (menu.path === activePath) return true;
    return Boolean(menu.children?.some((child) => child.path === activePath));
}

function isSceneChildActive(menu, child, activeScene) {
    if (child.path || child.children?.length) return false;
    const effectiveScene =
        activeScene || (menu.id === 'yolo' ? 'detect-train' : null);
    return effectiveScene === child.id;
}

export function Sidebar({
    activePath = '/',
    activeSearch = '',
    loggedIn = false,
    onNavigate,
    onRequireLogin,
}) {
    const activeScene = new URLSearchParams(activeSearch).get('scene');
    const [openMenus, setOpenMenus] = useState(() => ({
        'image-model': false,
        'lecture-rag': false,
        pca: false,
        svd: false,
        mf: false,
        transformer: false,
        yolo: false,
    }));

    useEffect(() => {
        if (activePath === '/lecture-rag') return;
        setOpenMenus((current) => ({
            ...current,
            'lecture-rag': false,
            pca: false,
            svd: false,
            mf: false,
            transformer: false,
        }));
    }, [activePath]);

    useEffect(() => {
        const activeMenu = pageMenus.find(
            (menu) => menu.children?.length && isMenuActive(menu, activePath),
        );
        if (!activeMenu) return;
        setOpenMenus((current) =>
            current[activeMenu.id] ? current : { ...current, [activeMenu.id]: true },
        );
    }, [activePath]);

    useEffect(() => {
        if (activePath !== '/lecture-rag' || !activeScene) return;
        if (activeScene.startsWith('svd_')) {
            setOpenMenus((current) => ({ ...current, 'lecture-rag': true, svd: true }));
            return;
        }
        if (activeScene.startsWith('mf_')) {
            setOpenMenus((current) => ({ ...current, 'lecture-rag': true, mf: true }));
            return;
        }
        if (activeScene.startsWith('tf_')) {
            setOpenMenus((current) => ({
                ...current,
                'lecture-rag': true,
                transformer: true,
            }));
            return;
        }
        setOpenMenus((current) => ({ ...current, 'lecture-rag': true, pca: true }));
    }, [activePath, activeScene]);

    return (
        <SidebarRoot>
            <SidebarTitle>메뉴</SidebarTitle>
            <MenuScroll>
                {pageMenus
                    .filter((menu) => !menu.hideFromSidebar)
                    .map((menu) => {
                        const isActive = isMenuActive(menu, activePath);
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
                                        <MenuChevron className={isOpen ? 'open' : undefined}>
                                            ▶
                                        </MenuChevron>
                                    ) : null}
                                </MenuLink>
                                {isActive && hasChildren && isOpen ? (
                                    <Submenu>
                                        {menu.children.map((child) => {
                                            const hasNested = Boolean(child.children?.length);
                                            const nestedOpen = Boolean(openMenus[child.id]);
                                            const childHref =
                                                child.path ?? `${menu.path}?scene=${child.id}`;
                                            const childActive = child.path
                                                ? activePath === child.path
                                                : hasNested
                                                  ? nestedOpen
                                                  : isSceneChildActive(menu, child, activeScene);

                                            return (
                                                <div key={child.id}>
                                                    <SubmenuLink
                                                        href={childHref}
                                                        className={
                                                            childActive ? 'active' : undefined
                                                        }
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (hasNested) {
                                                                setOpenMenus((current) => ({
                                                                    ...current,
                                                                    [child.id]: !current[child.id],
                                                                }));
                                                                return;
                                                            }
                                                            if (child.path) {
                                                                onNavigate?.(child.path);
                                                                return;
                                                            }
                                                            onNavigate?.(
                                                                `${menu.path}?scene=${child.id}`,
                                                            );
                                                        }}
                                                    >
                                                        {child.label}
                                                        {hasNested ? (
                                                            <MenuChevron
                                                                className={
                                                                    nestedOpen ? 'open' : undefined
                                                                }
                                                            >
                                                                ▶
                                                            </MenuChevron>
                                                        ) : null}
                                                    </SubmenuLink>

                                                    {hasNested && nestedOpen
                                                        ? child.children.map((scene) => (
                                                              <NestedSubmenuLink
                                                                  key={scene.id}
                                                                  href={`${menu.path}?scene=${scene.id}`}
                                                                  className={
                                                                      activeScene === scene.id
                                                                          ? 'active'
                                                                          : undefined
                                                                  }
                                                                  onClick={(e) => {
                                                                      e.preventDefault();
                                                                      onNavigate?.(
                                                                          `${menu.path}?scene=${scene.id}`,
                                                                      );
                                                                  }}
                                                              >
                                                                  {scene.label}
                                                              </NestedSubmenuLink>
                                                          ))
                                                        : null}
                                                </div>
                                            );
                                        })}
                                    </Submenu>
                                ) : null}
                            </div>
                        );
                    })}
            </MenuScroll>
        </SidebarRoot>
    );
}
