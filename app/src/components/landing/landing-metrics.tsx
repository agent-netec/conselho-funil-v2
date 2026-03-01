const metrics = [
  { value: '10x', label: 'Mais rápido que equipe tradicional' },
  { value: '500+', label: 'Templates e frameworks prontos' },
  { value: '24/7', label: 'Operação contínua, sem pausas' },
  { value: '23', label: 'Conselheiros de IA especializados' },
];

export function LandingMetrics() {
  return (
    <section className="py-16 border-y border-white/[0.04] bg-[#0D0B09]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m) => (
            <div
              key={m.value}
              className="border border-white/[0.04] bg-white/[0.01] rounded-xl p-6 text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-[#E6B447] mb-2">{m.value}</div>
              <div className="text-sm text-zinc-400">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
