import { AppShell } from '@/components/layout/app-shell';
import { HookGenerator } from '@/components/social/hook-generator';
import { Sparkles } from 'lucide-react';

export default function SocialPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8 p-6 lg:p-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-rose-400">
            <Sparkles className="h-5 w-5 fill-current" />
            <span className="text-sm font-bold uppercase tracking-wider">Conselho Social</span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 sm:text-4xl tracking-tight">
            Geração de Hooks Sociais
          </h1>
          <p className="text-zinc-400 max-w-2xl">
            Crie ganchos magnéticos para suas redes sociais usando as heurísticas do Conselho Social. 
            Selecione a plataforma, informe o tema e deixe a IA otimizar sua retenção.
          </p>
        </div>

        <div className="w-full">
          <HookGenerator />
        </div>
      </div>
    </AppShell>
  );
}

