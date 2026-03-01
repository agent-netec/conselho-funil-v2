'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQ_ITEMS = [
  {
    question: 'O que e o MKTHONEY?',
    answer:
      'MKTHONEY e uma plataforma SaaS de marketing autonomo com inteligencia artificial. Ela reune 23 especialistas de IA modelados em lendas do marketing como Gary Halbert, David Ogilvy e Russell Brunson. A plataforma cobre estrategia, criacao de conteudo, analise competitiva, automacao de campanhas e gestao de funil — tudo personalizado com a identidade e voz da sua marca, operando 24/7.',
  },
  {
    question: 'Como os 23 especialistas de IA funcionam?',
    answer:
      'Cada especialista e modelado com os frameworks reais de uma lenda do marketing. Quando voce faz uma consulta, multiplos especialistas analisam usando seus criterios especificos, debatem entre si e entregam um veredito unificado com score de confianca. Nao sao chatbots genericos — sao sistemas de avaliacao estruturados com red flags, gold standards e criterios ponderados.',
  },
  {
    question: 'Preciso ter conhecimento tecnico para usar o MKTHONEY?',
    answer:
      'Nao. O MKTHONEY foi projetado para ser usado por qualquer pessoa, do empreendedor solo ao gerente de marketing. O setup inicial leva 5 minutos pelo Brand Hub wizard. A plataforma traduz estrategias complexas em acoes praticas que voce pode aprovar e publicar com um clique.',
  },
  {
    question: 'O MKTHONEY substitui minha agencia de marketing?',
    answer:
      'Sim, esse e o objetivo. O MKTHONEY entrega inteligencia estrategica, criacao de conteudo, analise competitiva, automacao de campanhas e monitoramento de performance — funcoes que normalmente exigem uma equipe de 5-10 pessoas. A diferenca: opera 24/7, mantem 100% de consistencia de marca e custa uma fracao do preco de uma agencia.',
  },
  {
    question: 'Meus dados estao seguros?',
    answer:
      'Sim. O MKTHONEY usa isolamento total de dados por marca (multi-tenant), encriptacao AES-256-GCM para tokens de API, e autenticacao Firebase Auth. Cada marca tem seu proprio namespace no banco vetorial. Nenhum dado de uma marca e acessivel por outra.',
  },
  {
    question: 'Quais redes sociais o MKTHONEY suporta?',
    answer:
      'Atualmente o MKTHONEY integra com Instagram (Graph API), Meta Ads, Google Ads e LinkedIn. Integracoes com TikTok estao no roadmap. A plataforma gera conteudo otimizado para posts, stories, carrosseis e reels, adaptando formato e linguagem para cada plataforma automaticamente.',
  },
  {
    question: 'Posso gerenciar multiplas marcas?',
    answer:
      'Sim. O MKTHONEY suporta gerenciamento multi-marca com isolamento total de dados. Cada marca tem seu proprio Brand Hub, voz de marca, especialistas configurados e metricas independentes. Voce pode alternar entre marcas instantaneamente. O plano Agency e ideal para agencias e profissionais que gerenciam multiplos clientes.',
  },
  {
    question: 'O que e o Funnel Autopsy?',
    answer:
      'Funnel Autopsy e o diagnostico forense de funil do MKTHONEY. Voce cola a URL do seu funil e em menos de 60 segundos recebe uma analise completa de falhas de conversao, usando 5 heuristicas diferentes. Os 23 especialistas avaliam cada etapa e entregam recomendacoes especificas para melhorar sua taxa de conversao.',
  },
  {
    question: 'Qual tecnologia de IA o MKTHONEY usa?',
    answer:
      'MKTHONEY e construido sobre Google Gemini (modelos Flash e Pro), com RAG (Retrieval-Augmented Generation) usando Pinecone como banco vetorial. Cada resposta da IA e fundamentada no conhecimento especifico da sua marca, nao em respostas genericas.',
  },
];

function FaqItem({ question, answer, isOpen, onClick }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-b border-[#895F29]/20 last:border-b-0">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="text-[#F5E8CE] font-medium pr-4">{question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-[#E6B447] flex-shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-[#CAB792] pb-5 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 px-6">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E6B447]/10 border border-[#E6B447]/20 mb-6">
            <HelpCircle className="h-4 w-4 text-[#E6B447]" />
            <span className="text-sm text-[#E6B447] font-medium">Duvidas</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-[#F5E8CE]">
            Perguntas Frequentes Sobre o MKTHONEY
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#1A1612] rounded-2xl border border-[#895F29]/20 px-6"
        >
          {FAQ_ITEMS.map((item, index) => (
            <FaqItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
