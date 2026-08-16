import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    min-height: 100%;
  }

  body {
    margin: 0;
    min-height: 100svh;
    font: 18px/145% ${({ theme }) => theme.fonts.sans};
    letter-spacing: 0.18px;
    color: ${({ theme }) => theme.colors.text};
    color-scheme: light;
    background: ${({ theme }) => theme.colors.bodyBg};
    background-image:
      radial-gradient(ellipse 80% 60% at 20% 10%, rgba(255, 255, 255, 0.55), transparent 55%),
      radial-gradient(ellipse 70% 50% at 85% 20%, rgba(160, 196, 220, 0.55), transparent 50%),
      radial-gradient(ellipse 60% 40% at 50% 90%, rgba(190, 210, 230, 0.5), transparent 55%);
    background-attachment: fixed;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    background: transparent;
  }

  h1,
  h2 {
    font-family: ${({ theme }) => theme.fonts.sans};
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textHeading};
  }

  p {
    margin: 0;
  }

  a {
    color: inherit;
  }

  button,
  input {
    font: inherit;
  }
`;

export default GlobalStyle;