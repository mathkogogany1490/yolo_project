import { css } from 'styled-components';

/**
 * Glass 공식
 * gradient(135deg, white 15% → 5%) + blur(40px)
 * border rgba(255,255,255,0.45) + inset shadow
 */
export const glassCard = (tint = 'default') => {
    const tints = {
        default: null,
        detail: {
            from: 'rgba(220, 235, 245, 0.18)',
            to: 'rgba(255, 255, 255, 0.05)',
        },
        soft: {
            from: 'rgba(255, 255, 255, 0.12)',
            to: 'rgba(255, 255, 255, 0.04)',
        },
        accent: {
            from: 'rgba(58, 124, 165, 0.18)',
            to: 'rgba(255, 255, 255, 0.05)',
        },
    };

    const tintColors = tints[tint] ?? tints.default;

    return css`
    background: linear-gradient(
      135deg,
      ${tintColors ? tintColors.from : ({ theme }) => theme.colors.glassFrom},
      ${tintColors ? tintColors.to : ({ theme }) => theme.colors.glassTo}
    );
    backdrop-filter: blur(${({ theme }) => theme.blur.glass});
    -webkit-backdrop-filter: blur(${({ theme }) => theme.blur.glass});
    border: 1px solid ${({ theme }) => theme.colors.glassBorder};
    border-radius: ${({ theme }) => theme.radius.xl};
    box-shadow: ${({ theme }) => theme.shadow.glass};
  `;
};

export default glassCard;