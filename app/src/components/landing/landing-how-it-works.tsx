const steps = [
  {
    num: '01',
    title: 'MAPEAMENTO & FUNIL',
    line: 'Antes de atirar, você mira.',
    body: 'Em minutos, você tem o dossiê completo dos seus concorrentes. Sabe o que estão rodando, quanto estão gastando, onde estão falhando. Seu funil é dissecado em 60 segundos — cada buraco exposto, cada vazamento de lead identificado. Sem analista. Sem briefing. Sem reunião de alinhamento.',
  },
  {
    num: '02',
    title: 'COPY & CRIATIVOS',
    line: 'Conteúdo bom não viraliza. Conteúdo preciso converte.',
    body: 'Ofertas construídas com score de irresistibilidade. Headlines e hooks calibrados pro nível de consciência exato da sua audiência. Conteúdo que sai com a VOZ da sua marca — não com cara de template. Posts, stories, carrosséis, reels. Na frequência certa, no tom certo, no canal certo.',
  },
  {
    num: '03',
    title: 'TRACKING & OTIMIZAÇÃO',
    line: 'O que não se mede, morre.',
    body: 'Todas as métricas que importam, num painel só. Multi-canal. Tempo real. Com alerta automático antes do problema virar crise. Testes A/B rodando com significância estatística. E quando algo quebra no funil? Diagnóstico em 60 segundos. Enquanto você dorme, a operação otimiza.',
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#0D0B09]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E6B447]/60 mb-6">
          [ PROTOCOLO DE COMBATE ]
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 max-w-xl">
          Uma Pessoa. Três Fases.
        </h2>
        <p className="text-zinc-500 text-lg mb-16 max-w-lg">
          Mais Resultado Que Sua Última Agência em 12 Meses.
        </p>

        <div className="relative">
          {/* Vertical connector */}
          <div className="absolute left-5 top-6 bottom-6 w-px bg-[#E6B447]/10 hidden md:block" />

          <div className="space-y-14">
            {steps.map((step) => (
              <div key={step.num} className="relative flex gap-8">
                {/* Number circle */}
                <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#E6B447]/30 bg-[#0D0B09] z-10">
                  <span className="text-sm font-bold text-[#E6B447]">{step.num}</span>
                </div>

                {/* Content */}
                <div className="pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#E6B447] mb-2">
                    {step.title}
                  </p>
                  <p className="text-base font-semibold text-zinc-300 mb-3 italic">
                    &ldquo;{step.line}&rdquo;
                  </p>
                  <p className="text-sm text-zinc-500 leading-relaxed max-w-xl">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
