import styled from 'styled-components';
import { glassCard } from '../../styles/glassCard';

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(26, 43, 60, 0.28);
  backdrop-filter: blur(6px);
`;

export const ModalCard = styled.div`
  width: min(420px, 100%);
  padding: 24px;
  ${glassCard('detail')}
  border-radius: ${({ theme }) => theme.radius.xl};
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const ModalTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  color: ${({ theme }) => theme.colors.textHeading};
`;

export const ModalClose = styled.button`
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
`;

export const ModalError = styled.p`
  margin: 0 0 8px;
  color: ${({ theme }) => theme.colors.deleteTo};
  font-size: 13px;
`;