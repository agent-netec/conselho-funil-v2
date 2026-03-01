'use client';

import { useState } from 'react';

const tabs = [
  {
    label: 'Inteligência',
    features: [
      { name: 'Social Listening', desc: 'Monitora menções, hashtags e sentimento em tempo real.' },
      { name: 'Spy Agent', desc: 'Dossiê completo de concorrentes, tech stack e budget estimado.' },
      { name: 'Keywords Miner', desc: 'Volume e dificuldade por estágio do funil.' },
      { name: 'Deep Research', desc: 'Pesquisa automatizada de mercado e tendências.' },
      { name: 'Audience Scan', desc: 'Personas e scoring de propensão de compra.' },
      { name: 'Trend Radar', desc: 'Oportunidades via RSS, Google News e dados sociais.' },
    ],
  },
  {
    label: 'Biblioteca',
    features: [
      { name: 'Creative Vault', desc: 'Repositório versionado de criativos e copy que performaram.' },
      { name: 'Copy DNA', desc: 'Headlines e hooks calibrados por nível de consciência.' },
      { name: 'Funnel Blueprints', desc: 'Templates de funil validados por vertical.' },
      { name: 'Conversion Predictor', desc: 'Score preditivo de conversão antes de publicar.' },
      { name: 'Content Autopilot', desc: 'Curadoria automática de conteúdo evergreen.' },
    ],
  },
  {
    label: 'Operações',
    features: [
      { name: 'Content Calendar', desc: 'Drag-and-drop com 6 estados de aprovação e publicação automática.' },
      { name: 'Content Generation', desc: 'Posts, stories, reels com Brand Voice injetada.' },
      { name: 'A/B Testing', desc: 'Testes com atribuição determinística e significância estatística.' },
      { name: 'Campaign Automation', desc: 'Personalização por persona com regras de disparo.' },
      { name: 'War Room', desc: 'Dashboard multi-canal com detecção de anomalias.' },
      { name: 'Funnel Autopsy', desc: 'Diagnóstico forense de URL em 60 segundos.' },
      { name: 'Offer Lab', desc: 'Wizard de oferta irresistível com score de conversão.' },
    ],
  },
];

export function LandingFeatures() {
  const [active, setActive] = useState(0);

  return (
    <section id="features" className="py-24 bg-[#0D0B09]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-12 text-center">
          Tudo Que Sua Marca Precisa —{' '}
          <span className="text-[#E6B447]">Em Uma Única Plataforma</span>
        </h2>

        {/* Tab toggles */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActive(i)}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                active === i
                  ? 'bg-[#E6B447] text-[#0D0B09]'
                  : 'border border-white/[0.06] text-zinc-400 hover:border-[#E6B447]/20 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {tabs[active].features.map((f) => (
            <div
              key={f.name}
              className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 hover:border-[#E6B447]/20 hover:bg-[#E6B447]/[0.02] transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-[#E6B447] font-bold text-sm">✓</span>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">{f.name}</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
