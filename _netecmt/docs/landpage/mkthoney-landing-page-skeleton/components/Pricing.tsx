import React from 'react';

const Pricing: React.FC = () => {
  return (
    <section id="precos" aria-label="Preços" className="bg-surface border-y border-bronze/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-primary">Planos e Preços</h2>

        <div className="grid md:grid-cols-3 gap-8 mb-8 items-start">
          {/* STARTER */}
          <div className="bg-[var(--color-background)] border border-bronze/30 rounded-xl p-8 flex flex-col">
            <h3 className="text-lg font-bold mb-2 text-muted uppercase tracking-widest">Starter</h3>
            <div className="text-3xl font-bold mb-6 text-primary">R$ XX <span className="text-sm font-normal text-secondary">/mês</span></div>
            <ul className="mb-8 flex-grow space-y-4">
              <li className="text-secondary text-sm flex"><span className="text-accent mr-2">✓</span> 1 marca</li>
              <li className="text-secondary text-sm flex"><span className="text-accent mr-2">✓</span> Conselho Básico</li>
              <li className="text-secondary text-sm flex"><span className="text-accent mr-2">✓</span> Social Listening</li>
              <li className="text-secondary text-sm flex"><span className="text-accent mr-2">✓</span> Brand Hub</li>
            </ul>
            <button className="w-full btn-outline">
              Começar Grátis
            </button>
          </div>

          {/* PRO */}
          <div className="bg-[var(--color-background)] border-2 border-accent rounded-xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(230,180,71,0.1)]">
            <div className="absolute top-0 right-0 bg-accent text-surface text-xs px-3 py-1 rounded-bl rounded-tr-lg font-bold uppercase">Mais Popular</div>
            <h3 className="text-lg font-bold mb-2 text-accent uppercase tracking-widest">Pro</h3>
            <div className="text-4xl font-bold mb-6 text-primary">R$ XX <span className="text-sm font-normal text-secondary">/mês</span></div>
            <ul className="mb-8 flex-grow space-y-4">
              <li className="text-primary text-sm flex"><span className="text-accent mr-2">✓</span> 3 marcas</li>
              <li className="text-primary text-sm flex"><span className="text-accent mr-2">✓</span> Conselho Pro</li>
              <li className="text-primary text-sm flex"><span className="text-accent mr-2">✓</span> Spy Agent</li>
              <li className="text-primary text-sm flex"><span className="text-accent mr-2">✓</span> Automation & A/B Testing</li>
              <li className="text-primary text-sm flex"><span className="text-accent mr-2">✓</span> War Room</li>
            </ul>
            <button className="w-full btn-gold">
              Começar Pro →
            </button>
          </div>

          {/* AGENCY */}
          <div className="bg-[var(--color-background)] border border-bronze/30 rounded-xl p-8 flex flex-col">
            <h3 className="text-lg font-bold mb-2 text-muted uppercase tracking-widest">Agency</h3>
            <div className="text-3xl font-bold mb-6 text-primary">R$ XX <span className="text-sm font-normal text-secondary">/mês</span></div>
            <ul className="mb-8 flex-grow space-y-4">
              <li className="text-secondary text-sm flex"><span className="text-accent mr-2">✓</span> 10+ marcas</li>
              <li className="text-secondary text-sm flex"><span className="text-accent mr-2">✓</span> Conselho Full</li>
              <li className="text-secondary text-sm flex"><span className="text-accent mr-2">✓</span> White Label</li>
              <li className="text-secondary text-sm flex"><span className="text-accent mr-2">✓</span> API & Suporte Prio</li>
            </ul>
            <button className="w-full btn-outline">
              Falar com Sales
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-muted max-w-2xl mx-auto">
          Todos os planos incluem 14 dias grátis. Sem cartão de crédito. Cancele a qualquer momento.
        </p>
      </div>
    </section>
  );
};

export default Pricing;