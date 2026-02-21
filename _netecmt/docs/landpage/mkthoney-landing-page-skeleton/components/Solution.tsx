import React from 'react';

const Solution: React.FC = () => {
  return (
    <section id="solucao" aria-label="A Solução" className="bg-surface relative border-y border-bronze/20">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-[radial-gradient(ellipse_at_center,_var(--color-accent)_0%,_transparent_70%)] opacity-5 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-primary mb-8">O Que é o MktHoney — Sua Agência de Marketing Autônoma</h2>
          
          <div className="bg-[var(--color-background)] border border-bronze/50 p-6 rounded-lg max-w-3xl mx-auto mb-12 text-left">
            <p className="text-secondary text-lg">
              <strong className="text-accent block mb-2 uppercase tracking-wide text-xs">Answer Capsule</strong>
              MktHoney é uma plataforma de marketing autônomo que transforma qualquer marca
              em uma operação de alta performance. Utilizando 23 conselheiros de IA baseados
              em frameworks reais, a plataforma cobre desde inteligência competitiva até criação de conteúdo e
              automação de campanhas.
            </p>
          </div>
        </div>

        {/* 3 Pillars */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          
          <article className="bg-[var(--color-background)] p-8 rounded-xl border border-bronze/30 hover:border-accent/50 transition duration-300">
            <h3 className="text-xl font-bold mb-6 text-accent flex items-center">
              <span className="text-2xl mr-3">🧠</span> INTELIGÊNCIA
            </h3>
            <ul className="space-y-3 text-secondary">
              <li className="flex items-start"><span className="text-bronze mr-2">▪</span> Espionagem competitiva</li>
              <li className="flex items-start"><span className="text-bronze mr-2">▪</span> Social listening</li>
              <li className="flex items-start"><span className="text-bronze mr-2">▪</span> Keyword mining</li>
              <li className="flex items-start"><span className="text-bronze mr-2">▪</span> Pesquisa de mercado</li>
            </ul>
          </article>

          <article className="bg-[var(--color-background)] p-8 rounded-xl border border-bronze/30 hover:border-accent/50 transition duration-300">
            <h3 className="text-xl font-bold mb-6 text-accent flex items-center">
              <span className="text-2xl mr-3">📚</span> BIBLIOTECA
            </h3>
            <ul className="space-y-3 text-secondary">
              <li className="flex items-start"><span className="text-bronze mr-2">▪</span> Cofre criativo</li>
              <li className="flex items-start"><span className="text-bronze mr-2">▪</span> Blueprints de funil</li>
              <li className="flex items-start"><span className="text-bronze mr-2">▪</span> Templates de conteúdo</li>
              <li className="flex items-start"><span className="text-bronze mr-2">▪</span> DNA de copy</li>
            </ul>
          </article>

          <article className="bg-[var(--color-background)] p-8 rounded-xl border border-bronze/30 hover:border-accent/50 transition duration-300">
            <h3 className="text-xl font-bold mb-6 text-accent flex items-center">
              <span className="text-2xl mr-3">⚡</span> OPERAÇÕES
            </h3>
             <ul className="space-y-3 text-secondary">
              <li className="flex items-start"><span className="text-bronze mr-2">▪</span> Calendário editorial</li>
              <li className="flex items-start"><span className="text-bronze mr-2">▪</span> Automação de campanhas</li>
              <li className="flex items-start"><span className="text-bronze mr-2">▪</span> Publicação multi-canal</li>
              <li className="flex items-start"><span className="text-bronze mr-2">▪</span> Testes A/B</li>
            </ul>
          </article>
        </div>

        {/* Impact Bar */}
        <div className="bg-[var(--color-background)] border border-bronze rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center shadow-lg">
          <div><div className="text-2xl font-bold text-accent mb-1">-80%</div><div className="text-xs text-muted uppercase">tempo</div></div>
          <div><div className="text-2xl font-bold text-accent mb-1">100%</div><div className="text-xs text-muted uppercase">consistência</div></div>
          <div><div className="text-2xl font-bold text-accent mb-1">-90%</div><div className="text-xs text-muted uppercase">custo</div></div>
          <div><div className="text-2xl font-bold text-accent mb-1">24/7</div><div className="text-xs text-muted uppercase">operação</div></div>
        </div>
      </div>
    </section>
  );
};

export default Solution;