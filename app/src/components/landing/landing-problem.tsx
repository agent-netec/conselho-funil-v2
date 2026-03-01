import { X } from 'lucide-react';

const falsePaths = [
  {
    title: 'Contratar uma agência',
    consequence:
      'R$ 10.000, R$ 15.000, R$ 20.000 por mês. Um estagiário no WhatsApp. Conteúdo que poderia ser de qualquer marca.',
  },
  {
    title: 'Montar equipe interna',
    consequence:
      'Copywriter, social media, gestor de tráfego, designer, analista de dados. Folha de R$ 30.000+. E ainda precisa gerenciar todo mundo.',
  },
  {
    title: 'Usar ferramentas de IA',
    consequence:
      '7 plataformas diferentes. Prompts no ChatGPT. Rezando pra sair algo que não pareça robô falando.',
  },
];

export function LandingProblem() {
  return (
    <section id="filosofia" className="py-24 bg-[#0D0B09]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E6B447]/60 mb-6">
          [ FILOSOFIA ]
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-8 max-w-2xl">
          O Mercado Te Convenceu Que Você Precisa de Mais Gente. Mentira.
        </h2>

        <div className="space-y-2 mb-12">
          <p className="text-zinc-400">Você quer escalar. Todo mundo quer.</p>
          <p className="text-zinc-400">E o mercado te diz para seguir um desses três caminhos:</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {falsePaths.map((path) => (
            <div
              key={path.title}
              className="rounded-2xl border border-[#C45B3A]/20 bg-[#C45B3A]/[0.03] p-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C45B3A]/10 flex-shrink-0 mt-0.5">
                  <X className="h-4 w-4 text-[#C45B3A]" />
                </div>
                <h3 className="font-semibold text-white leading-tight">{path.title}</h3>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">{path.consequence}</p>
            </div>
          ))}
        </div>

        <div className="border-l-4 border-[#E6B447] pl-6 max-w-2xl">
          <p className="text-zinc-300 text-lg leading-relaxed">
            Três caminhos. O mesmo resultado: você continua dependendo dos outros.
            Seu marketing continua refém de terceiros. Sua operação continua mais
            lenta que a do concorrente.
          </p>
        </div>
      </div>
    </section>
  );
}
