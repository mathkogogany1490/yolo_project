import styled from 'styled-components';

export const LayoutRoot = styled.div`
  --app-sidebar-width: ${({ theme }) => theme.layout.sidebarWidth};

  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.layoutGap};
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  padding: ${({ theme }) => theme.space.page};
  background: transparent;
  box-sizing: border-box;
`;

export const LayoutBody = styled.div`
  display: grid;
  grid-template-columns: var(--app-sidebar-width) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space.layoutGap};
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow: hidden;
`;

export const ContentArea = styled.main`
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const ContentViewport = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  & > * {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
`;
