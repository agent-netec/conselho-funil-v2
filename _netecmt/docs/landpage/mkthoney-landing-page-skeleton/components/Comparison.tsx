import React from 'react';

const Comparison: React.FC = () => {
  const rows = [
    { crit: "Custo mensal", agency: "R$ 5k - R$ 30k", free: "R$ 2k - R$ 8k", honey: "A partir de R$ XX" },
    { crit: "Disponibilidade", agency: "Comercial", free: "Variável", honey: "24/7, Sempre" },
    { crit: "Tempo de entrega", agency: "5-15 dias", free: "3-7 dias", honey: "Minutos" },
    { crit: "Consistência", agency: "Média", free: "Baixa", honey: "100% Garantida" },
    { crit: "Inteligência", agency: "Mensal", free: "Nenhuma", honey: "Tempo Real" },
    { crit: "Especialistas", agency: "3-5", free: "1", honey: "23 Conselheiros" },
  ];

  return (
    <section id="comparacao" aria-label="Comparativo" className="bg-surface border-y border-bronze/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 text-primary">Por Que Escolher o MktHoney?</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-bronze/30">
                <th className="p-6 text-muted font-medium w-1/4">Critério</th>
                <th className="p-6 text-muted font-medium text-center w-1/4">Agência</th>
                <th className="p-6 text-muted font-medium text-center w-1/4">Freelancer</th>
                <th className="p-6 text-accent font-bold text-center w-1/4 bg-[rgba(230,180,71,0.05)] rounded-t-lg border-t border-l border-r border-accent/20">MktHoney</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bronze/10">
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="p-6 text-primary font-medium">{row.crit}</td>
                  <td className="p-6 text-center text-secondary">{row.agency}</td>
                  <td className="p-6 text-center text-secondary">{row.free}</td>
                  <td className="p-6 text-center text-accent font-bold bg-[rgba(230,180,71,0.05)] border-l border-r border-accent/20">{row.honey}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
               <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="bg-[rgba(230,180,71,0.05)] rounded-b-lg border-b border-l border-r border-accent/20 h-4"></td>
               </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Comparison;