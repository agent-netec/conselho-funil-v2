'use client';

import { motion } from 'framer-motion';
import { Users, MessageSquare } from 'lucide-react';

const COUNSELORS = [
  { name: 'Gary Halbert', specialty: 'Direct Response', icon: '🎯' },
  { name: 'Eugene Schwartz', specialty: '5 Niveis de Consciencia', icon: '📝' },
  { name: 'Russell Brunson', specialty: 'Funis de Conversao', icon: '🔥' },
  { name: 'David Ogilvy', specialty: 'Branding & Research', icon: '📊' },
  { name: 'Claude Hopkins', specialty: 'Publicidade Cientifica', icon: '🧲' },
  { name: 'Seth Godin', specialty: 'Marketing de Permissao', icon: '💡' },
  { name: 'P.T. Barnum', specialty: 'Showmanship', icon: '🎪' },
  { name: 'Jay Abraham', specialty: 'Growth & Partnerships', icon: '📈' },
];

const DEBATE_STEPS = [
  'Cada conselheiro analisa pelo seu prisma especializado',
  'Eles debatem pontos de concordancia e divergencia',
  'O sistema consolida um veredito com score de confianca',
  'Voce recebe recomendacoes fundamentadas em multiplas perspectivas',
];

export function LandingCouncil() {
  return (
    <section id="conselho" className="py-20 px-6 bg-[#1A1612]/30">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E6B447]/10 border border-[#E6B447]/20 mb-6">
            <Users className="h-4 w-4 text-[#E6B447]" />
            <span className="text-sm text-[#E6B447] font-medium">O Diferencial</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-[#F5E8CE] mb-6">
            O Conselho — 23 Especialistas de Marketing
            <br className="hidden md:block" />
            Trabalhando Juntos Pela Sua Marca
          </h2>

          <p className="text-lg text-[#CAB792] max-w-3xl mx-auto leading-relaxed">
            O diferencial do MktHoney e o Conselho: 23 conselheiros de IA, cada um modelado
            com os frameworks, metodos e criterios reais de uma lenda do marketing mundial.
          </p>
        </motion.div>

        {/* Counselors Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {COUNSELORS.map((counselor, index) => (
            <motion.div
              key={counselor.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="p-4 rounded-xl bg-[#0D0B09] border border-[#895F29]/20 hover:border-[#E6B447]/30 transition-colors text-center"
            >
              <div className="text-3xl mb-2">{counselor.icon}</div>
              <h4 className="text-sm font-semibold text-[#F5E8CE] mb-1">{counselor.name}</h4>
              <p className="text-xs text-[#AB8648]">{counselor.specialty}</p>
            </motion.div>
          ))}
        </div>

        {/* +15 more badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E6B447]/10 border border-[#E6B447]/20 text-sm text-[#E6B447]">
            + 15 especialistas em Copy, Social, Ads e Design
          </span>
        </motion.div>

        {/* Multi-Agent Debate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="p-8 rounded-2xl bg-[#0D0B09] border border-[#895F29]/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6B447]/10">
              <MessageSquare className="h-5 w-5 text-[#E6B447]" />
            </div>
            <h3 className="text-xl font-bold text-[#F5E8CE]">
              Como o Debate Multi-Agente Funciona
            </h3>
          </div>

          <p className="text-[#CAB792] mb-6 leading-relaxed">
            Quando voce pede uma analise, nao e uma IA generica respondendo.
            Multiplos conselheiros avaliam sua marca usando seus proprios frameworks:
          </p>

          <div className="space-y-3">
            {DEBATE_STEPS.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E6B447]/10 text-[#E6B447] text-xs font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm text-[#F5E8CE]">{step}</p>
              </div>
            ))}
          </div>

          <p className="text-[#E6B447] mt-6 font-medium">
            E como ter uma mesa redonda com as maiores mentes do marketing —
            disponivel 24/7, exclusivamente para a sua marca.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
