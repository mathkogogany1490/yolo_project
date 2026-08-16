import styled from 'styled-components';

/** 폼 한 줄: input과 높이 38px 맞춤 */
export const RowButton = styled.button`
  height: 38px;
  padding: 0 16px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px solid rgba(255, 255, 255, 0.35);
  font-weight: 700;
  cursor: pointer;
  color: #fff;
  background: ${({ $danger, $edit, theme }) =>
    $danger
        ? `linear-gradient(135deg, ${theme.colors.deleteFrom}, ${theme.colors.deleteTo})`
        : $edit
            ? `linear-gradient(135deg, ${theme.colors.editFrom}, ${theme.colors.editTo})`
            : `linear-gradient(135deg, ${theme.colors.primaryFrom}, ${theme.colors.primaryTo})`};

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;