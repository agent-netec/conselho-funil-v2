'use client';

import { motion } from 'framer-motion';
import { Brain, BookOpen, Zap, CheckCircle2 } from 'lucide-react';

const PILLARS = [
  {
    icon: Brain,
    title: 'INTELIGENCIA',
    description: 'Espionagem competitiva, social listening, keyword mining, pesquisa de mercado',
  },
  {
    icon: BookOpen,
    title: 'BIBLIOTECA',
    description: 'Cofre criativo, blueprints de funil, templates de conteudo, DNA de copy',
  },
  {
    icon: Zap,
    title: 'OPERACOES',
    description: 'Calendario editorial, automacao de campanhas, publicacao multi-canal, testes A/B',
  },
];

const METRICS = [
  { value: '-80%', label: 'no tempo de criacao' },
  { value: '100%', label: 'consistencia de marca' },
  { value: '-90%', label: 'vs. custo de agencia' },
  { value: '24/7', label: 'operacao continua' },
];

export function LandingSolution() {
  return (
    <section id="funcionalidades" className="py-20 px-6 bg-[#1A1612]/30">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E6B447]/10 border border-[#E6B447]/20 mb-6">
            <CheckCircle2 className="h-4 w-4 text-[#E6B447]" />
            <span className="text-sm text-[#E6B447] font-medium">A Solucao</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-[#F5E8CE] mb-6">
            O Que e o MKTHONEY — Sua Agencia de Marketing Autonoma
          </h2>

          <p className="text-lg text-[#CAB792] max-w-3xl mx-auto leading-relaxed">
            MKTHONEY e uma plataforma de marketing autonomo que transforma qualquer marca
            em uma operacao de alta performance. Utilizando 23 especialistas de IA baseados
            em frameworks reais de lendas como Gary Halbert, David Ogilvy e Eugene Schwartz.
          </p>
        </motion.div>

        {/* 3 Pillars */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PILLARS.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-[#0D0B09] border border-[#895F29]/20 hover:border-[#E6B447]/30 transition-colors"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#E6B447]/10 mb-5">
                <pillar.icon className="h-7 w-7 text-[#E6B447]" />
              </div>
              <h3 className="text-sm font-bold text-[#E6B447] tracking-wider mb-3">
                {pillar.title}
              </h3>
              <p className="text-sm text-[#CAB792] leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {METRICS.map((metric, index) => (
            <div
              key={index}
              className="text-center p-5 rounded-xl bg-[#0D0B09] border border-[#895F29]/20"
            >
              <div className="text-2xl md:text-3xl font-bold text-[#E6B447] mb-1">
                {metric.value}
              </div>
              <div className="text-xs text-[#AB8648] uppercase tracking-wider">
                {metric.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
