import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Public pages layout (legal pages).
 * No sidebar, simple header with logo and back link.
 * Dark theme consistent with app styling.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <span className="text-lg font-bold text-emerald-400">M</span>
              </div>
              <span className="text-lg font-bold text-white">MKTHONEY</span>
            </Link>

            {/* Back to app */}
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao app
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-zinc-900/50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-500">
              LEVIARK INTERMEDIACOES LTDA - CNPJ: 62.625.246/0001-06
            </p>
            <div className="flex gap-4 text-xs text-zinc-500">
              <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                Termos
              </Link>
              <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                Privacidade
              </Link>
              <Link href="/cookies" className="hover:text-emerald-400 transition-colors">
                Cookies
              </Link>
              <Link href="/refund" className="hover:text-emerald-400 transition-colors">
                Reembolso
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
