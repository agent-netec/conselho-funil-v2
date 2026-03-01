export function LandingSolution() {
  return (
    <section className="py-24 bg-[#0D0B09]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="relative">
          <div className="pointer-events-none absolute -inset-x-20 -top-20 h-40 bg-[radial-gradient(ellipse_at_center,rgba(230,180,71,0.06),transparent_70%)]" />

          <div className="relative max-w-3xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8">
              MKTHONEY É{' '}
              <span className="text-[#E6B447]">O Multiplicador.</span>
            </h2>

            <div className="space-y-5 text-lg text-zinc-400 leading-relaxed mb-12">
              <p>
                Dentro desta plataforma, 23 conselheiros treinados nos frameworks de{' '}
                <span className="text-[#F5E8CE]">Gary Halbert</span>,{' '}
                <span className="text-[#F5E8CE]">Eugene Schwartz</span>,{' '}
                <span className="text-[#F5E8CE]">Dan Kennedy</span> e{' '}
                <span className="text-[#F5E8CE]">Russell Brunson</span>{' '}
                analisam, debatem e te entregam vereditos fundamentados.
              </p>
              <p>
                Eles não são o produto.{' '}
                <span className="text-white font-semibold">VOCÊ é o produto.</span>{' '}
                Eles são o multiplicador de força que faz um operador solo competir
                com departamentos inteiros.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { strike: 'Você não contrata.', gold: 'Você opera.' },
                { strike: 'Você não depende.', gold: 'Você decide.' },
                { strike: 'Você não espera.', gold: 'Você escala.' },
                { strike: 'Uma plataforma.', gold: '23 mentes. Suas regras.' },
              ].map((item) => (
                <div key={item.strike} className="flex items-baseline gap-2.5">
                  <span className="text-zinc-600 line-through text-sm">{item.strike}</span>
                  <span className="text-[#E6B447] font-semibold text-sm">{item.gold}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
