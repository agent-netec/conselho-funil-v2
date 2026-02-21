import React, { useState } from 'react';

type FeatureRow = {
  name: string;
  desc: string;
};

const FeatureList = ({ data }: { data: FeatureRow[] }) => (
  <div className="grid md:grid-cols-2 gap-4 mt-8">
    {data.map((row, i) => (
      <div key={i} className="bg-surface p-4 rounded border border-bronze/20 flex items-start">
        <div className="text-accent mr-3 mt-1">✓</div>
        <div>
          <h4 className="font-bold text-primary text-sm">{row.name}</h4>
          <p className="text-secondary text-sm mt-1">{row.desc}</p>
        </div>
      </div>
    ))}
  </div>
);

const Features: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const intelligenceData = [
    { name: "Social Listening", desc: "Monitora menções, hashtags e sentimento" },
    { name: "Spy Agent", desc: "Dossier completo de concorrentes e tech stack" },
    { name: "Keywords Miner", desc: "Volume e dificuldade por estágio do funil" },
    { name: "Deep Research", desc: "Pesquisa automatizada de mercado" },
    { name: "Audience Deep-Scan", desc: "Personas e scoring de propensão" },
    { name: "Trend Radar", desc: "Oportunidades via RSS + Google News" },
  ];

  const libraryData = [
    { name: "Creative Vault", desc: "Repositório versionado de criativos" },
    { name: "Copy DNA", desc: "Headlines e hooks por nível de consciência" },
    { name: "Funnel Blueprints", desc: "Templates de funil validados" },
    { name: "Conversion Predictor", desc: "Score preditivo de conversão" },
    { name: "Content Autopilot", desc: "Curadoria automática" },
  ];

  const operationsData = [
    { name: "Content Calendar", desc: "Drag-and-drop com 6 estados de aprovação" },
    { name: "Content Generation", desc: "Posts com Brand Voice injetada" },
    { name: "A/B Testing", desc: "Atribuição determinística" },
    { name: "Campaign Automation", desc: "Personalização por persona" },
    { name: "Performance War Room", desc: "Dashboard com detecção de anomalias" },
    { name: "Funnel Autopsy", desc: "Diagnóstico forense de URL" },
    { name: "Offer Lab", desc: "Wizard de oferta irresistível" },
  ];

  const tabs = ["Ala de Inteligência", "Ala de Biblioteca", "Ala de Operações"];
  const content = [intelligenceData, libraryData, operationsData];

  return (
    <section id="funcionalidades" aria-label="Funcionalidades Detalhadas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 text-primary">Tudo Que Sua Marca Precisa — Em Uma Única Plataforma</h2>
        
        {/* Mobile View: Stacked */}
        <div className="md:hidden space-y-8">
           {tabs.map((tab, index) => (
             <div key={index}>
               <h3 className="text-xl font-bold text-accent mb-4 border-b border-bronze/30 pb-2">{tab}</h3>
               <FeatureList data={content[index]} />
             </div>
           ))}
        </div>

        {/* Desktop View: Tabs/Carousel */}
        <div className="hidden md:block max-w-5xl mx-auto">
          <div className="flex justify-center space-x-4 mb-8">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-8 py-3 rounded-full text-lg font-bold transition-all ${
                  activeTab === index 
                    ? 'bg-accent text-surface' 
                    : 'bg-surface text-secondary border border-bronze/30 hover:border-accent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="bg-[var(--color-background)] p-8 rounded-2xl border border-bronze/30 min-h-[400px]">
             <FeatureList data={content[activeTab]} />
          </div>

          <div className="text-center mt-12">
            <a href="#" className="text-accent hover:text-white font-bold text-lg border-b border-accent hover:border-white transition-colors pb-1">
              Ver Todas as Funcionalidades →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;