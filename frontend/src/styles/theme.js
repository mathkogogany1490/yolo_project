/** 0단계 디자인 토큰 */
export const theme = {
    colors: {
        bodyBg: '#cbd9e7',
        text: '#3d4f63',
        textHeading: '#1a2b3c',

        accent: '#3a7ca5',
        accentBg: 'rgba(58, 124, 165, 0.14)',
        accentBorder: 'rgba(58, 124, 165, 0.45)',

        glassFrom: 'rgba(255, 255, 255, 0.15)',
        glassTo: 'rgba(255, 255, 255, 0.05)',
        glassBorder: 'rgba(255, 255, 255, 0.45)',
        glassHighlight: 'rgba(255, 255, 255, 0.65)',
        glassInsetBottom: 'rgba(255, 255, 255, 0.18)',
        glassShadow: 'rgba(74, 108, 140, 0.18)',

        inputBg: 'rgba(255, 255, 255, 0.25)',
        inputFocusBorder: 'rgba(168, 85, 247, 0.5)',
        inputFocusRing: 'rgba(168, 85, 247, 0.1)',

        primaryFrom: '#a855f7',
        primaryMid: '#7c3aed',
        primaryTo: '#6d28d9',
        primaryGlow: 'rgba(168, 85, 247, 0.45)',

        editFrom: '#34d399',
        editMid: '#10b981',
        editTo: '#059669',

        deleteFrom: '#f87171',
        deleteMid: '#ef4444',
        deleteTo: '#dc2626',

        sidebarActiveText: '#0f766e',
        sidebarActiveFrom: 'rgba(45, 212, 191, 0.35)',
        sidebarActiveTo: 'rgba(34, 211, 238, 0.28)',
        sidebarActiveBorder: 'rgba(45, 212, 191, 0.55)',
    },

    blur: {
        glass: '40px',
        input: '10px',
    },

    radius: {
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '28px',
        pill: '9999px',
    },

    space: {
        page: '32px',
    },

    shadow: {
        glass: `
      inset 0 1px 0 rgba(255, 255, 255, 0.65),
      inset 0 -1px 0 rgba(255, 255, 255, 0.18),
      0 8px 32px rgba(74, 108, 140, 0.18)
    `,
    },

    fonts: {
        sans: `'Segoe UI', system-ui, sans-serif`,
        mono: `ui-monospace, Consolas, monospace`,
    },
};

export default theme;