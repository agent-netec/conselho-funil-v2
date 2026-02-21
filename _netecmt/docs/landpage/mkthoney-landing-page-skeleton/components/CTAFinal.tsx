import React from 'react';

const CTAFinal: React.FC = () => {
  return (
    <section id="cta-final" aria-label="Chamada Final" className="py-24 bg-surface border-t border-bronze/20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-primary mb-8">Comece Agora — Sua Marca Merece uma Agência de Verdade</h2>
        <p className="text-xl text-secondary mb-12 max-w-2xl mx-auto">
          Chega de pagar caro por resultados medíocres. O MktHoney coloca
          23 dos maiores estrategistas do mundo trabalhando
          pela sua marca — agora, 24/7.
        </p>
        
        <div className="flex flex-col items-center">
          <button className="btn-gold text-xl px-12 py-5 shadow-[0_0_20px_rgba(230,180,71,0.4)]">
             Criar Minha Conta Grátis →
          </button>
          <span className="mt-6 text-sm text-muted">14 dias grátis. Sem cartão de crédito. Setup em 5 minutos.</span>
        </div>

        <div className="mt-12 flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-6 text-muted text-xs font-mono tracking-wider">
          <span>🔒 DADOS ENCRIPTADOS AES-256</span>
          <span className="hidden md:inline text-bronze">•</span>
          <span>🇧🇷 SERVIDORES NO BRASIL</span>
          <span className="hidden md:inline text-bronze">•</span>
          <span>⚡ 302 TESTES, 100% APROVAÇÃO</span>
        </div>
      </div>
    </section>
  );
};

export default CTAFinal;