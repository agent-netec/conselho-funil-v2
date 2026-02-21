import React from 'react';

const Problem: React.FC = () => {
  return (
    <section id="problema" aria-label="O Problema">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-primary mb-6">O Marketing da Sua Marca Está Preso em 2020</h2>
          <p className="text-xl text-secondary max-w-3xl mx-auto leading-relaxed">
            Você contrata uma agência que cobra R$ 5.000/mês e entrega
            relatórios genéricos. Ou monta uma equipe interna que custa
            3x mais e ainda depende de freelancers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <article className="card-honey p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl leading-none select-none text-red-500 group-hover:opacity-20 transition">!</div>
            <div className="w-14 h-14 bg-[rgba(196,91,58,0.2)] rounded-full mb-6 flex items-center justify-center text-2xl border border-[rgba(196,91,58,0.5)]">
              ❌
            </div>
            <p className="text-lg text-primary font-medium">Publicam conteúdo 5x mais rápido que você</p>
          </article>

          <article className="card-honey p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl leading-none select-none text-red-500 group-hover:opacity-20 transition">!</div>
            <div className="w-14 h-14 bg-[rgba(196,91,58,0.2)] rounded-full mb-6 flex items-center justify-center text-2xl border border-[rgba(196,91,58,0.5)]">
              ❌
            </div>
            <p className="text-lg text-primary font-medium">Analisam seu funil e roubam suas ideias com IA</p>
          </article>

          <article className="card-honey p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl leading-none select-none text-red-500 group-hover:opacity-20 transition">!</div>
            <div className="w-14 h-14 bg-[rgba(196,91,58,0.2)] rounded-full mb-6 flex items-center justify-center text-2xl border border-[rgba(196,91,58,0.5)]">
              ❌
            </div>
            <p className="text-lg text-primary font-medium">Operam 24/7 enquanto sua equipe trabalha 8h</p>
          </article>
        </div>

        <div className="text-center max-w-4xl mx-auto">
           <p className="text-2xl font-bold text-accent">
             E se você tivesse uma agência completa — com 23 especialistas —
             trabalhando exclusivamente para sua marca, por uma fração do custo?
           </p>
        </div>
      </div>
    </section>
  );
};

export default Problem;