import styled from 'styled-components';
import { glassCard } from '../../styles/glassCard';

/** detail tint GlassPanel */
export const GlassPanel = styled.section`
  width: 100%;
  ${glassCard('detail')}
  padding: 28px;
  text-align: left;

  @media (max-width: 1024px) {
    padding: 20px;
    border-radius: ${({ theme }) => theme.radius.lg};
  }
`;

export default GlassPanel;