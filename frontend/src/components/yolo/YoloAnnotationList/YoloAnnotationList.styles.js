import styled from 'styled-components';

export const AnnotationList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const AnnotationItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  background: ${({ $editing, $selected }) =>
    $editing
        ? 'rgba(245, 158, 11, 0.2)'
        : $selected
            ? 'rgba(245, 158, 11, 0.12)'
            : 'rgba(255, 255, 255, 0.25)'};
  border: 1px solid
    ${({ $editing, $selected }) => ($editing || $selected ? '#f59e0b' : 'transparent')};
  font-size: 13px;
`;

export const ItemActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`;

export const EditHint = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text};
`;