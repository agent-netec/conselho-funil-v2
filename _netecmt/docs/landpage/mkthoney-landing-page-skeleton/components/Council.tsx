import React from 'react';

const Council: React.FC = () => {
  const members = [
    { name: "Gary Halbert", role: "Direct Response" },
    { name: "Eugene Schwartz", role: "5 Níveis de Consciência" },
    { name: "Russell Brunson", role: "Funis de Conversão" },
    { name: "David Ogilvy", role: "Branding & Research" },
    { name: "Claude Hopkins", role: "Publicidade Científica" },
    { name: "Seth Godin", role: "Marketing de Permissão" },
    { name: "P.T. Barnum", role: "Showmanship" },
    { name: "Jay Abraham", role: "Growth & Partnerships" },
  ];

  return (
    <section id="conselho" aria-label="O Conselho" className="bg-surface border-y border-bronze/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
           <h2 className="text-3xl md:text-5xl font-bold text-primary mb-6">O Conselho — 23 Especialistas de Marketing</h2>
           <div className="max-w-3xl mx-auto mb-12">
            <p className="text-secondary text-lg">
              O diferencial do MktHoney é o Conselho: 23 conselheiros de IA, cada um modelado
              com os frameworks, métodos e critérios reais de uma lenda do marketing mundial.
            </p>
          </div>
        </div>

        {/* Grid 4x2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {members.map((member, i) => (
            <article key={i} className="bg-[var(--color-background)] p-6 rounded-lg text-center border border-bronze/30 hover:border-accent transition hover:-translate-y-1">
              <div className="w-20 h-20 bg-surface rounded-full mx-auto mb-4 flex items-center justify-center text-2xl border border-bronze/20">
                👤
              </div>
              <h4 className="font-bold text-primary mb-1">{member.name}</h4>
              <p className="text-xs text-accent uppercase tracking-wider">{member.role}</p>
            </article>
          ))}
        </div>

        <div className="text-center mb-16">
          <span className="inline-block border border-accent rounded-full px-6 py-2 text-accent font-bold text-sm bg-[rgba(230,180,71,0.05)]">
            +15 especialistas
          </span>
        </div>

        {/* Multi-Agent Debate Logic */}
        <div className="bg-[var(--color-background)] p-8 md:p-12 rounded-2xl border border-bronze/30 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-center text-primary">Como o Debate Multi-Agente Funciona</h3>
          <div className="grid md:grid-cols-4 gap-4 text-center">
             <div className="p-4 bg-surface rounded border border-bronze/10">
                <div className="font-bold text-accent text-xl mb-2">01</div>
                <div className="text-sm text-secondary">Análise Especializada</div>
             </div>
             <div className="p-4 bg-surface rounded border border-bronze/10">
                <div className="font-bold text-accent text-xl mb-2">02</div>
                <div className="text-sm text-secondary">Debate & Divergência</div>
             </div>
             <div className="p-4 bg-surface rounded border border-bronze/10">
                <div className="font-bold text-accent text-xl mb-2">03</div>
                <div className="text-sm text-secondary">Convergência</div>
             </div>
             <div className="p-4 bg-surface rounded border border-bronze/10">
                <div className="font-bold text-accent text-xl mb-2">04</div>
                <div className="text-sm text-secondary">Plano de Ação</div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Council;