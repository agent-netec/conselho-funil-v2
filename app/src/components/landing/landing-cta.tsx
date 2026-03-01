import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingCta() {
  return (
    <section className="relative py-32 bg-[#0D0B09] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(230,180,71,0.12),transparent_70%)]" />
      <div className="relative mx-auto max-w-3xl px-6 lg:px-12 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-6">
          Seus concorrentes não estão esperando você montar uma equipe.
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
          O Marketing Não Espera.
          <br />
          <span className="text-[#E6B447]">Nem Você Deveria.</span>
        </h2>
        <p className="text-zinc-400 mb-10">
          14 dias grátis. Sem cartão. Sem compromisso.
        </p>

        <Link
          href="/signup"
          className="group inline-flex items-center gap-2 rounded-xl bg-[#E6B447] px-8 py-4 text-lg font-bold text-[#0D0B09] hover:bg-[#F0C35C] transition-colors"
        >
          Iniciar Operação
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
