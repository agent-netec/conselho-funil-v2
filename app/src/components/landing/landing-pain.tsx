'use client';

import { motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

const PAIN_POINTS = [
  'Publicam conteudo 5x mais rapido que voce',
  'Analisam seu funil e roubam suas ideias com IA',
  'Operam 24/7 enquanto sua equipe trabalha 8h',
];

export function LandingPain() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C45B3A]/10 border border-[#C45B3A]/20 mb-6">
            <AlertTriangle className="h-4 w-4 text-[#C45B3A]" />
            <span className="text-sm text-[#C45B3A] font-medium">O Problema</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-[#F5E8CE] mb-6">
            O Marketing da Sua Marca Esta Preso em 2020
          </h2>

          <p className="text-lg text-[#CAB792] max-w-2xl mx-auto">
            Voce contrata uma agencia que cobra R$ 5.000/mes e entrega relatorios genericos.
            Ou monta uma equipe interna que custa 3x mais e ainda depende de freelancers.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-10"
        >
          <p className="text-xl text-[#F5E8CE] font-semibold">
            Enquanto isso, seus concorrentes:
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {PAIN_POINTS.map((pain, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              className="p-5 rounded-xl bg-[#C45B3A]/5 border border-[#C45B3A]/20"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C45B3A]/10 flex-shrink-0 mt-0.5">
                  <X className="h-3.5 w-3.5 text-[#C45B3A]" />
                </div>
                <p className="text-[#F5E8CE] text-sm leading-relaxed">{pain}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <p className="text-xl text-[#E6B447] font-semibold">
            E se voce tivesse uma agencia completa — com 23 especialistas —
            <br className="hidden md:block" />
            trabalhando exclusivamente para sua marca, por uma fracao do custo?
          </p>
        </motion.div>
      </div>
    </section>
  );
}
