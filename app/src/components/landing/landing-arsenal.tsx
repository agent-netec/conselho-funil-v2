import { Eye, BookOpen, Zap } from 'lucide-react';

const columns = [
  {
    icon: Eye,
    title: 'INTELIGÊNCIA',
    subtitle: 'Saiba tudo. Antes de todos. Sozinho.',
    body: 'Espionagem competitiva em tempo real. Social listening que não depende de hashtag. Keywords que seus concorrentes estão comprando agora. Pesquisa de mercado em 3 minutos.',
    modules: ['Spy Agent', 'Social Listening', 'Keywords Miner', 'Deep Research', 'Audience Scan', 'Trend Radar'],
  },
  {
    icon: BookOpen,
    title: 'BIBLIOTECA',
    subtitle: 'Seu cofre de munição. Sempre carregado.',
    body: 'Todo criativo que funcionou. Todo funil que converteu. Todo headline que passou no teste. Organizado, versionado e pronto pra reutilizar. Com score preditivo em cada peça.',
    modules: ['Creative Vault', 'Copy DNA', 'Funnel Blueprints', 'Conversion Predictor', 'Content Autopilot'],
  },
  {
    icon: Zap,
    title: 'OPERAÇÕES',
    subtitle: 'Execução no piloto automático. Você no comando.',
    body: 'Calendário editorial rodando. Conteúdo saindo com a voz da SUA marca. Testes A/B decidindo o que performa melhor — sem achismo. Dashboard multi-canal com alertas em tempo real.',
    modules: ['Content Calendar', 'Content Gen', 'A/B Testing', 'Campaign Automation', 'War Room', 'Funnel Autopsy', 'Offer Lab'],
  },
];

const counselors = [
  { name: 'Gary Halbert', role: 'Direct Response' },
  { name: 'Eugene Schwartz', role: '5 Níveis de Consciência' },
  { name: 'Russell Brunson', role: 'Funis de Conversão' },
  { name: 'David Ogilvy', role: 'Branding & Research' },
  { name: 'Claude Hopkins', role: 'Publicidade Científica' },
  { name: 'Seth Godin', role: 'Marketing de Permissão' },
  { name: 'P.T. Barnum', role: 'Showmanship' },
  { name: 'Jay Abraham', role: 'Growth & Partnerships' },
];

export function LandingArsenal() {
  return (
    <section id="arsenal" className="py-24 bg-[#0D0B09]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E6B447]/60 mb-6">
          [ INFRAESTRUTURA ]
        </p>

        <div className="max-w-2xl mb-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            Tudo Que Uma Agência de 10 Pessoas Faz.
            <span className="text-[#E6B447]"> Numa Tela. Na Sua Mão.</span>
          </h2>
        </div>
        <p className="text-zinc-400 max-w-2xl mb-16 text-sm leading-relaxed">
          Você não precisa de um gestor de tráfego, um copywriter, um social media, um analista de dados
          e um diretor criativo. Precisa de um sistema que coloca tudo isso no mesmo painel — e te deixa no controle.
        </p>

        {/* 3 columns */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {columns.map((col) => {
            const Icon = col.icon;
            return (
              <div
                key={col.title}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 hover:border-[#E6B447]/20 hover:bg-[#E6B447]/[0.02] transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6B447]/10 mb-4">
                  <Icon className="h-5 w-5 text-[#E6B447]" />
                </div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#E6B447] mb-1">{col.title}</h3>
                <p className="text-sm font-semibold text-white mb-3">{col.subtitle}</p>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">{col.body}</p>
                <div className="flex flex-wrap gap-1.5">
                  {col.modules.map((mod) => (
                    <span
                      key={mod}
                      className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-zinc-500"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Counselors grid */}
        <div className="border-t border-white/[0.04] pt-16">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E6B447]/60 mb-4">
            23 CONSELHEIROS
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-10">
            Lendas do Marketing. Treinadas. Disponíveis. 24/7.
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {counselors.map((c) => (
              <div
                key={c.name}
                className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-center hover:border-[#E6B447]/20 transition-colors"
              >
                <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-[#E6B447]/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-[#E6B447]">{c.name.charAt(0)}</span>
                </div>
                <p className="text-sm font-semibold text-white mb-0.5">{c.name}</p>
                <p className="text-[11px] text-[#E6B447]/70 uppercase tracking-wide">{c.role}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <span className="inline-block rounded-full border border-[#E6B447]/30 bg-[#E6B447]/[0.06] px-6 py-2 text-sm text-[#E6B447] font-bold">
              +15 especialistas
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
