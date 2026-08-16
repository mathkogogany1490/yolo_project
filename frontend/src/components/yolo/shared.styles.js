import styled from 'styled-components';

export const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-end;
`;

export const FieldLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
`;

export const TextInput = styled.input`
  min-width: 120px;
  height: 38px;
  padding: 0 10px;
  box-sizing: border-box;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
  background: ${({ theme }) => theme.colors.inputBg};
`;

export const Select = styled.select`
  min-width: 160px;
  height: 38px;
  padding: 0 10px;
  box-sizing: border-box;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px solid ${({ theme }) => theme.colors.glassBorder};
  background: ${({ theme }) => theme.colors.inputBg};
`;

export const HiddenFile = styled.input`
  display: none;
`;

export const Hint = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  align-self: center;
`;

export const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.deleteTo};
  font-size: 14px;
`;

export const SuccessText = styled.p`
  margin: 0;
  color: #047857;
  font-size: 14px;
`;

export const PanelSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const SectionTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textHeading};
`;

export const EmptyHint = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
`;