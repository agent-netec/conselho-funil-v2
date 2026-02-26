'use client';

import Link from 'next/link';

/**
 * Legal footer component with company info (required by Decreto 7.962/2013).
 * Contains links to legal pages and contact information.
 * Uses [PLACEHOLDERS] for company data that need to be replaced.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06] bg-zinc-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <span className="text-sm font-bold text-emerald-400">M</span>
              </div>
              <span className="text-sm font-bold text-white">MKTHONEY</span>
            </div>
            <div className="space-y-1 text-xs text-zinc-500">
              <p>LEVIARK INTERMEDIACOES LTDA</p>
              <p>CNPJ: 62.625.246/0001-06</p>
              <p>Av. Republica do Libano, 251</p>
              <p>Sao Paulo - SP</p>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
                >
                  Politica de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
                >
                  Politica de Cookies
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors"
                >
                  Politica de Reembolso
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / LGPD */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest mb-4">
              Contato & LGPD
            </h4>
            <div className="space-y-2 text-sm text-zinc-500">
              <p>
                <span className="text-zinc-400">Suporte:</span>{' '}
                <a
                  href="mailto:support@mkthoney.com"
                  className="hover:text-emerald-400 transition-colors"
                >
                  support@mkthoney.com
                </a>
              </p>
              <p>
                <span className="text-zinc-400">DPO (Privacidade):</span>{' '}
                <a
                  href="mailto:support@mkthoney.com"
                  className="hover:text-emerald-400 transition-colors"
                >
                  support@mkthoney.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/[0.04]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-600">
              &copy; {currentYear} MKTHONEY. Todos os direitos reservados.
            </p>
            <p className="text-xs text-zinc-600">
              Feito com 🧠 e IA para marketeiros exigentes.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Minimal footer for settings pages or areas where full footer is too heavy.
 */
export function FooterMinimal() {
  return (
    <footer className="py-4 text-center">
      <div className="flex items-center justify-center gap-4 text-xs text-zinc-600">
        <Link href="/terms" className="hover:text-zinc-400 transition-colors">
          Termos
        </Link>
        <span>•</span>
        <Link href="/privacy" className="hover:text-zinc-400 transition-colors">
          Privacidade
        </Link>
        <span>•</span>
        <Link href="/cookies" className="hover:text-zinc-400 transition-colors">
          Cookies
        </Link>
        <span>•</span>
        <Link href="/refund" className="hover:text-zinc-400 transition-colors">
          Reembolso
        </Link>
      </div>
    </footer>
  );
}
