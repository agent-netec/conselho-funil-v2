import React from 'react';

const FAQ: React.FC = () => {
  const faqs = [
    {
      q: "O que é o MktHoney?",
      a: "MktHoney é uma plataforma SaaS de marketing autônomo com inteligência artificial. Ela reúne 23 conselheiros de IA modelados em lendas do marketing. A plataforma cobre estratégia, criação de conteúdo, análise competitiva, automação de campanhas e gestão de funil — tudo personalizado com a identidade da sua marca."
    },
    {
      q: "Como os 23 conselheiros de IA funcionam?",
      a: "Cada conselheiro é modelado com os frameworks reais de uma lenda do marketing. Quando você faz uma consulta, múltiplos conselheiros analisam usando seus critérios específicos, debatem entre si e entregam um veredito unificado com score de confiança."
    },
    {
      q: "Preciso ter conhecimento técnico?",
      a: "Não. O MktHoney foi projetado para ser usado por qualquer pessoa. O setup inicial leva 5 minutos pelo Brand Hub wizard. A plataforma traduz estratégias complexas em ações práticas que você pode aprovar com um clique."
    },
    {
      q: "Substitui agência de marketing?",
      a: "Sim. O MktHoney entrega inteligência estratégica, criação de conteúdo, análise e automação — funções de uma equipe inteira. Opera 24/7, mantém 100% de consistência de marca e custa uma fração do preço."
    },
    {
      q: "Meus dados estão seguros?",
      a: "Sim. Isolamento total de dados por marca, encriptação AES-256-GCM e autenticação robusta. Seus dados nunca são compartilhados entre marcas."
    }
  ];

  return (
    <section id="faq" aria-label="Perguntas Frequentes">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-primary">Perguntas Frequentes</h2>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-surface rounded-lg border border-bronze/30 open:border-accent">
              <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-6 text-primary group-hover:text-accent transition-colors">
                <span className="text-lg">{faq.q}</span>
                <span className="transition-transform duration-300 group-open:rotate-180 text-accent">
                  ▼
                </span>
              </summary>
              <div className="text-secondary mt-0 px-6 pb-6 leading-relaxed border-t border-bronze/10 pt-4">
                <p>{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;