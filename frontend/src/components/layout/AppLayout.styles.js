import styled from 'styled-components';

export const LayoutRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 100svh;
  padding: ${({ theme }) => theme.space.page};
  background: transparent;
`;

export const LayoutBody = styled.div`
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
`;

export const ContentArea = styled.main`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
`;