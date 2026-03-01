const rows = [
  {
    feature: 'Custo mensal',
    mkthoney: 'A partir de R$ 97',
    agency: 'R$ 5k – R$ 30k',
    diy: 'R$ 500 – R$ 2k',
    freelancer: 'R$ 3k – R$ 8k',
  },
  {
    feature: 'Disponibilidade',
    mkthoney: '24/7',
    agency: 'Horário comercial',
    diy: 'Você opera',
    freelancer: 'Limitada',
  },
  {
    feature: 'Especialistas',
    mkthoney: '23 IA especializados',
    agency: '3 – 5',
    diy: '0',
    freelancer: '1',
  },
  {
    feature: 'Setup',
    mkthoney: '5 minutos',
    agency: '2 – 4 semanas',
    diy: 'Semanas',
    freelancer: 'Dias',
  },
  {
    feature: 'Dependência',
    mkthoney: 'Zero',
    agency: 'Total',
    diy: 'Parcial',
    freelancer: 'Alta',
  },
  {
    feature: 'Consistência de marca',
    mkthoney: '100% garantida',
    agency: 'Média',
    diy: 'Você faz',
    freelancer: 'Baixa',
  },
];

export function LandingComparison() {
  return (
    <section className="py-24 bg-[#0D0B09]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 text-center">
          Por Que Escolher o MKTHONEY?
        </h2>
        <p className="text-zinc-400 text-center mb-12 max-w-xl mx-auto text-sm">
          Para quem gosta de comparar — os números não mentem.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.04]">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-600 w-1/5">
                  Critério
                </th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-[#E6B447] text-center w-1/5 bg-[#E6B447]/[0.04] border-l border-r border-[#E6B447]/10">
                  MKTHONEY
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-600 text-center w-1/5">
                  Agência
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-600 text-center w-1/5">
                  DIY (ferramentas)
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-600 text-center w-1/5">
                  Freelancer
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {rows.map((row) => (
                <tr key={row.feature} className="hover:bg-white/[0.01]">
                  <td className="p-4 text-sm font-medium text-white">{row.feature}</td>
                  <td className="p-4 text-center text-sm text-[#E6B447] font-semibold bg-[#E6B447]/[0.03] border-l border-r border-[#E6B447]/10">
                    {row.mkthoney}
                  </td>
                  <td className="p-4 text-center text-sm text-zinc-500">{row.agency}</td>
                  <td className="p-4 text-center text-sm text-zinc-500">{row.diy}</td>
                  <td className="p-4 text-center text-sm text-zinc-500">{row.freelancer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
