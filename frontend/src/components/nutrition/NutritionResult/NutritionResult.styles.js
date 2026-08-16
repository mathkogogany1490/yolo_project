import styled from 'styled-components';

export const ResultRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
`;

export const ResultTitle = styled.h2`
  margin: 0;
  font-size: 22px;
  color: ${({ theme }) => theme.colors.textHeading};
`;

export const ResultText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
  white-space: pre-wrap;
`;

export const NutriList = styled.ul`
  margin: 0;
  padding-left: 18px;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.7;
`;