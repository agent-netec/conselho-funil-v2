'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    q: 'Isso substitui minha agência?',
    a: 'Sim. Esse é o ponto. Com o MKTHONEY, você opera inteligência competitiva, criação de conteúdo, automação de campanhas e monitoramento de performance sozinho. Funções que normalmente exigem de 5 a 10 pessoas. Sua marca fica 100% consistente. Sua operação roda 24/7. E você não depende mais de ninguém.',
  },
  {
    q: 'E se eu não entendo de marketing?',
    a: 'Não precisa. O setup leva 5 minutos. Você define sua marca, audiência e tom de voz. A plataforma traduz estratégias complexas em ações práticas que você aprova com um clique. Os 23 conselheiros fazem a análise pesada — você toma a decisão final. Se sabe o que vende e pra quem vende, é o suficiente.',
  },
  {
    q: 'Quem são os "23 conselheiros"?',
    a: 'São sistemas de avaliação treinados nos frameworks reais de lendas do marketing direto — Gary Halbert, Eugene Schwartz, Dan Kennedy, Russell Brunson, David Ogilvy, entre outros. Quando você consulta, múltiplos conselheiros analisam pelo seu prisma específico, debatem entre si e entregam UM veredito unificado com score de confiança. Não é chatbot com nome bonito. É engenharia de decisão.',
  },
  {
    q: 'Consigo operar 10+ clientes sozinho?',
    a: 'Sim. Cada marca tem seu próprio espaço isolado — tom de voz, identidade visual, conselheiros configurados e métricas independentes. Você alterna entre marcas instantaneamente. Uma pessoa gerenciando 10, 15, 20 marcas com a mesma consistência que uma agência com 50 funcionários.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Isolamento total por marca. Encriptação AES-256-GCM. Cada marca tem namespace próprio. Nenhum dado cruza de uma marca pra outra. Seus tokens e credenciais são armazenados com criptografia de nível bancário. Servidores no Brasil.',
  },
  {
    q: 'E se eu não gostar em 14 dias?',
    a: 'Você sai. Sem pergunta. Sem retenção. Sem cobrar cartão que você nem cadastrou. Os 14 dias são reais — não é trial com funcionalidades cortadas. É o produto inteiro. Se não servir, vai embora. Simples.',
  },
  {
    q: 'Que tipo de conteúdo consigo produzir?',
    a: 'Posts, stories, carrosséis, reels, headlines, hooks, scripts de anúncio, copies de email, estruturas de funil, ofertas formatadas. Tudo sai com a voz e identidade da sua marca. Não é template. É conteúdo sob medida, calibrado para o nível de consciência da sua audiência.',
  },
  {
    q: 'Funciona para qual nicho?',
    a: 'Qualquer marca que precisa de marketing consistente e não quer (ou não pode) manter uma equipe pra isso. Infoprodutores, SaaS, e-commerce, serviços, agências solo. A plataforma se adapta à sua vertical, ao seu público e ao seu tom de voz.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.04]">
      <button
        onClick={() => setOpen(!open)}
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
          <Minus className="h-4 w-4 text-[#E6B447] flex-shrink-0" />
        ) : (
          <Plus className="h-4 w-4 text-zinc-500 flex-shrink-0" />
        )}
      </button>
      {open && (
        <p className="pb-5 text-sm text-zinc-400 leading-relaxed">{a}</p>
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
          Sem Enrolação. Só Respostas.
        </h2>

        <div>
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
