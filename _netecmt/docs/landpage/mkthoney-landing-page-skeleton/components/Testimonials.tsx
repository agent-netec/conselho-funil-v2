import React from 'react';

const Testimonials: React.FC = () => {
  return (
    <section id="depoimentos" aria-label="Depoimentos">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-primary">O Que Nossos Usuários Dizem</h2>

        <div className="grid md:grid-cols-3 gap-8">
          <figure className="card-honey p-8 flex flex-col">
            <blockquote className="text-secondary mb-6 italic text-lg leading-relaxed flex-grow">
              "Em 30 dias, o MktHoney reduziu nosso tempo de produção de conteúdo de 2 semanas para 2 horas. O Conselho identificou um gap que nunca vimos."
            </blockquote>
            <figcaption className="flex items-center pt-6 border-t border-bronze/20">
              <div className="w-12 h-12 bg-surface border border-bronze rounded-full mr-3"></div>
              <div>
                <div className="font-bold text-primary">Carlos M.</div>
                <div className="text-xs text-muted">CMO @ TechStart</div>
              </div>
            </figcaption>
            <div className="mt-4 text-green-400 font-mono text-sm">
              ▲ +43% conversão
            </div>
          </figure>

           <figure className="card-honey p-8 flex flex-col">
            <blockquote className="text-secondary mb-6 italic text-lg leading-relaxed flex-grow">
              "A consistência da voz da marca é impressionante. Finalmente posso escalar minhas campanhas sem perder a identidade."
            </blockquote>
            <figcaption className="flex items-center pt-6 border-t border-bronze/20">
              <div className="w-12 h-12 bg-surface border border-bronze rounded-full mr-3"></div>
              <div>
                <div className="font-bold text-primary">Ana P.</div>
                <div className="text-xs text-muted">Fundadora @ Infoprodutos</div>
              </div>
            </figcaption>
            <div className="mt-4 text-green-400 font-mono text-sm">
              ▲ ROI 4x Ads
            </div>
          </figure>

           <figure className="card-honey p-8 flex flex-col">
            <blockquote className="text-secondary mb-6 italic text-lg leading-relaxed flex-grow">
              "O Offer Lab transformou nossa oferta principal. Seguimos as sugestões do conselho e a taxa de fechamento dobrou."
            </blockquote>
            <figcaption className="flex items-center pt-6 border-t border-bronze/20">
              <div className="w-12 h-12 bg-surface border border-bronze rounded-full mr-3"></div>
              <div>
                <div className="font-bold text-primary">Ricardo S.</div>
                <div className="text-xs text-muted">Diretor Vendas SaaS</div>
              </div>
            </figcaption>
            <div className="mt-4 text-green-400 font-mono text-sm">
              ▲ Recorde vendas
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;