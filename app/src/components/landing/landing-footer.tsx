'use client';

import Link from 'next/link';

const FOOTER_LINKS = {
  produto: [
    { label: 'Funcionalidades', href: '#funcionalidades' },
    { label: 'Precos', href: '#precos' },
    { label: 'Como Funciona', href: '#como-funciona' },
  ],
  recursos: [
    { label: 'FAQ', href: '#faq' },
    { label: 'Blog', href: '#' },
    { label: 'Ajuda', href: '#' },
  ],
  legal: [
    { label: 'Termos de Uso', href: '/terms' },
    { label: 'Privacidade', href: '/privacy' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Reembolso', href: '/refund' },
  ],
};

export function LandingFooter() {
  return (
    <footer className="border-t border-[#895F29]/20 bg-[#0D0B09] py-12 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Logo */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E6B447]/10">
                <span className="text-lg font-bold text-[#E6B447]">M</span>
              </div>
              <span className="text-lg font-bold text-[#F5E8CE]">MKTHONEY</span>
            </div>
            <p className="text-sm text-[#AB8648]">
              Plataforma de marketing autonomo com inteligencia artificial.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-[#F5E8CE] mb-4">Produto</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.produto.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[#AB8648] hover:text-[#E6B447] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#F5E8CE] mb-4">Recursos</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.recursos.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[#AB8648] hover:text-[#E6B447] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#F5E8CE] mb-4">Legal</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#AB8648] hover:text-[#E6B447] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[#895F29]/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#593519]">
            LEVIARK INTERMEDIACOES LTDA - CNPJ: 62.625.246/0001-06
          </p>
          <p className="text-xs text-[#593519]">
            © 2026 MktHoney. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
