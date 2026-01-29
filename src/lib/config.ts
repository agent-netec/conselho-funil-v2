/**
 * Configurações globais do sistema.
 */
export const CONFIG = {
  // US-16.1: Habilita ou desabilita o limite de créditos
  // Mudar para true quando for para produção
  ENABLE_CREDIT_LIMIT: false,
  
  // Saldo inicial para novos usuários
  INITIAL_CREDITS: 10,
  
  // Ambiente de desenvolvimento
  IS_DEV: process.env.NODE_ENV === 'development',
};






