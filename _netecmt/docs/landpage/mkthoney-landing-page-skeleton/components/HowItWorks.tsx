import React from 'react';

const HowItWorks: React.FC = () => {
  return (
    <section id="como-funciona" aria-label="Como Funciona">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-primary">Como Funciona — Da Configuração à Execução</h2>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-bronze to-transparent opacity-30 z-0"></div>

          {/* Step 1 */}
          <div className="relative z-10 flex flex-col h-full">
            <div className="self-center bg-[var(--color-background)] border-2 border-accent text-accent font-bold px-4 py-2 rounded-full mb-8 shadow-[0_0_15px_rgba(230,180,71,0.3)]">
              ⏱ 5 minutos
            </div>
            <div className="card-honey p-6 flex-grow flex flex-col">
              <h3 className="text-xl font-bold mb-4 text-primary">Configure Sua Marca</h3>
              <p className="text-secondary mb-6 text-sm">
                Cadastre-se e passe pelo Brand Hub. Defina paleta, tom de voz e público-alvo. O MktHoney cria o DNA da sua marca.
              </p>
              <div className="mt-auto bg-[var(--color-background)] border border-bronze/20 rounded h-32 flex items-center justify-center text-muted text-xs">
                [IMG: Brand Hub Wizard]
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col h-full">
             <div className="self-center bg-[var(--color-background)] border-2 border-accent text-accent font-bold px-4 py-2 rounded-full mb-8 shadow-[0_0_15px_rgba(230,180,71,0.3)]">
              ⏱ 10 minutos
            </div>
            <div className="card-honey p-6 flex-grow flex flex-col">
              <h3 className="text-xl font-bold mb-4 text-primary">Ative o Conselho</h3>
              <p className="text-secondary mb-6 text-sm">
                Escolha uma missão (campanha, funil, conteúdo). 23 conselheiros debatem e entregam estratégias unificadas.
              </p>
               <div className="mt-auto bg-[var(--color-background)] border border-bronze/20 rounded h-32 flex items-center justify-center text-muted text-xs">
                [IMG: Interface Conselho]
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col h-full">
             <div className="self-center bg-[var(--color-background)] border-2 border-accent text-accent font-bold px-4 py-2 rounded-full mb-8 shadow-[0_0_15px_rgba(230,180,71,0.3)]">
              ⏱ 30 dias
            </div>
            <div className="card-honey p-6 flex-grow flex flex-col">
              <h3 className="text-xl font-bold mb-4 text-primary">Execute e Escale</h3>
              <p className="text-secondary mb-6 text-sm">
                Aprove e publique. O sistema cuida do calendário, testes A/B e otimização contínua 24/7.
              </p>
               <div className="mt-auto bg-[var(--color-background)] border border-bronze/20 rounded h-32 flex items-center justify-center text-muted text-xs">
                [IMG: Dashboard Execução]
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <button className="btn-gold text-lg">
            Quero Começar Agora →
          </button>
          <p className="mt-4 text-sm text-muted">Sem cartão de crédito. Cancele quando quiser.</p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;