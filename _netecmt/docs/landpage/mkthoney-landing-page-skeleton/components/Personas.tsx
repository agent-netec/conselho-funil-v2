import React from 'react';

const Personas: React.FC = () => {
  return (
    <section id="para-quem" aria-label="Para Quem é o MktHoney">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-primary">Para Quem é o MktHoney</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <article className="card-honey p-6">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-bold mb-2 text-primary uppercase tracking-wide">Empreendedor / Infoprodutor</h3>
            <p className="text-accent text-sm mb-4 italic border-l-2 border-accent pl-3">"Meu funil parou de converter"</p>
            <ul className="space-y-2">
              <li className="flex items-start text-xs text-secondary"><span className="text-bronze mr-2">▪</span> Funnel Autopsy</li>
              <li className="flex items-start text-xs text-secondary"><span className="text-bronze mr-2">▪</span> 23 conselheiros</li>
              <li className="flex items-start text-xs text-secondary"><span className="text-bronze mr-2">▪</span> Content Autopilot</li>
            </ul>
          </article>

          <article className="card-honey p-6">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-lg font-bold mb-2 text-primary uppercase tracking-wide">Media Buyer</h3>
            <p className="text-accent text-sm mb-4 italic border-l-2 border-accent pl-3">"A oferta não segura os leads"</p>
            <ul className="space-y-2">
              <li className="flex items-start text-xs text-secondary"><span className="text-bronze mr-2">▪</span> Offer Lab</li>
              <li className="flex items-start text-xs text-secondary"><span className="text-bronze mr-2">▪</span> Spy Agent</li>
              <li className="flex items-start text-xs text-secondary"><span className="text-bronze mr-2">▪</span> A/B Testing</li>
            </ul>
          </article>

          <article className="card-honey p-6">
            <div className="text-4xl mb-4">👔</div>
            <h3 className="text-lg font-bold mb-2 text-primary uppercase tracking-wide">Gerente de Marketing</h3>
            <p className="text-accent text-sm mb-4 italic border-l-2 border-accent pl-3">"Preciso de visibilidade rápida"</p>
            <ul className="space-y-2">
              <li className="flex items-start text-xs text-secondary"><span className="text-bronze mr-2">▪</span> War Room</li>
              <li className="flex items-start text-xs text-secondary"><span className="text-bronze mr-2">▪</span> Audience Deep-Scan</li>
              <li className="flex items-start text-xs text-secondary"><span className="text-bronze mr-2">▪</span> Calendar</li>
            </ul>
          </article>

          <article className="card-honey p-6">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-lg font-bold mb-2 text-primary uppercase tracking-wide">Agência / Multi-marca</h3>
            <p className="text-accent text-sm mb-4 italic border-l-2 border-accent pl-3">"Gerencio 10 marcas"</p>
            <ul className="space-y-2">
              <li className="flex items-start text-xs text-secondary"><span className="text-bronze mr-2">▪</span> Multi-Brand Isolation</li>
              <li className="flex items-start text-xs text-secondary"><span className="text-bronze mr-2">▪</span> Brand Voice Check</li>
              <li className="flex items-start text-xs text-secondary"><span className="text-bronze mr-2">▪</span> Dashboard Unificado</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
};

export default Personas;