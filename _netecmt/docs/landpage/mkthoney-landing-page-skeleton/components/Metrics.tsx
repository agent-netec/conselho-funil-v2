import React from 'react';

const Metrics: React.FC = () => {
  // In a real app, use IntersectionObserver to animate numbers from 0
  return (
    <section id="metricas" aria-label="Métricas de Impacto" className="py-16 bg-surface border-b border-bronze/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          
          <div className="text-center p-6">
            <div className="text-6xl font-bold text-accent mb-2">-80%</div>
            <div className="text-lg text-secondary">Tempo de criação de conteúdo</div>
          </div>

          <div className="text-center p-6 border-l-0 md:border-l border-bronze/20">
            <div className="text-6xl font-bold text-accent mb-2">23</div>
            <div className="text-lg text-secondary">Conselheiros IA especializados</div>
          </div>

          <div className="text-center p-6 border-l-0 md:border-l border-bronze/20">
            <div className="text-6xl font-bold text-accent mb-2">24/7</div>
            <div className="text-lg text-secondary">Operação contínua</div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Metrics;