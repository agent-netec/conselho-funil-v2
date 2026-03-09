'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    q: 'Isso substitui minha agencia?',
    a: 'Sim. Esse e o ponto. Com o MKTHONEY, voce opera inteligencia competitiva, criacao de conteudo, automacao de campanhas e monitoramento de performance sozinho. Funcoes que normalmente exigem de 5 a 10 pessoas. Sua marca fica 100% consistente. Sua operacao roda 24/7. E voce nao depende mais de ninguem.',
  },
  {
    q: 'E se eu nao entendo de marketing?',
    a: 'Nao precisa. O setup leva 5 minutos. Voce define sua marca, audiencia e tom de voz. A plataforma traduz estrategias complexas em acoes praticas que voce aprova com um clique. Os 23 conselheiros fazem a analise pesada — voce toma a decisao final. Se sabe o que vende e pra quem vende, e o suficiente.',
  },
  {
    q: 'Quem sao os "23 conselheiros"?',
    a: 'Sao sistemas de avaliacao treinados nos frameworks reais de lendas do marketing direto — Gary Halbert, Eugene Schwartz, Dan Kennedy, Russell Brunson, David Ogilvy, entre outros. Quando voce consulta, multiplos conselheiros analisam pelo seu prisma especifico, debatem entre si e entregam UM veredito unificado com score de confianca. Nao e chatbot com nome bonito. E engenharia de decisao.',
  },
  {
    q: 'Consigo operar 10+ clientes sozinho?',
    a: 'Sim. Cada marca tem seu proprio espaco isolado — tom de voz, identidade visual, conselheiros configurados e metricas independentes. Voce alterna entre marcas instantaneamente. Uma pessoa gerenciando 10, 15, 20 marcas com a mesma consistencia que uma agencia com 50 funcionarios.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Isolamento total por marca. Encriptacao AES-256-GCM. Cada marca tem namespace proprio. Nenhum dado cruza de uma marca pra outra. Seus tokens e credenciais sao armazenados com criptografia de nivel bancario. Servidores no Brasil.',
  },
  {
    q: 'E se eu nao gostar em 14 dias?',
    a: 'Voce sai. Sem pergunta. Sem retencao. Sem cobrar cartao que voce nem cadastrou. Os 14 dias sao reais — nao e trial com funcionalidades cortadas. E o produto inteiro. Se nao servir, vai embora. Simples.',
  },
  {
    q: 'Que tipo de conteudo consigo produzir?',
    a: 'Posts, stories, carrosseis, reels, headlines, hooks, scripts de anuncio, copies de email, estruturas de funil, ofertas formatadas. Tudo sai com a voz e identidade da sua marca. Nao e template. E conteudo sob medida, calibrado para o nivel de consciencia da sua audiencia.',
  },
  {
    q: 'Funciona para qual nicho?',
    a: 'Qualquer marca que precisa de marketing consistente e nao quer (ou nao pode) manter uma equipe pra isso. Infoprodutores, SaaS, e-commerce, servicos, agencias solo. A plataforma se adapta a sua vertical, ao seu publico e ao seu tom de voz.',
  },
];

function FaqItem({ q, a, id }: { q: string; a: string; id: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.04]">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`faq-answer-${id}`}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span
          className={`text-sm font-semibold transition-colors ${
            open ? 'text-[#E6B447]' : 'text-white hover:text-[#E6B447]'
          }`}
        >
          {q}
        </span>
        {open ? (
          <Minus className="h-4 w-4 text-[#E6B447] flex-shrink-0" aria-hidden="true" />
        ) : (
          <Plus className="h-4 w-4 text-zinc-500 flex-shrink-0" aria-hidden="true" />
        )}
      </button>
      {open && (
        <p id={`faq-answer-${id}`} role="region" className="pb-5 text-sm text-zinc-400 leading-relaxed">
          {a}
        </p>
      )}
    </div>
  );
}

export function LandingFaq() {
  return (
    <section id="faq" className="py-24 bg-[#0D0B09]">
      <div className="mx-auto max-w-3xl px-6 lg:px-12">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E6B447]/60 mb-6 text-center">
          [ PERGUNTAS FREQUENTES ]
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-12 text-center">
          Sem Enrolacao. So Respostas.
        </h2>

        <div>
          {faqs.map((faq, i) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} id={String(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
