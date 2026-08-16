import styled from 'styled-components';

export const MainRoot = styled.div`
  flex: 1;
  min-height: 0;
  background: transparent;
  padding: ${({ theme }) => theme.space.page};
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const MainTitle = styled.h1`
  margin: 0 0 8px;
  font-size: 32px;
  letter-spacing: -0.8px;
  color: ${({ theme }) => theme.colors.textHeading};
`;

export const MainDesc = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.5;
`;