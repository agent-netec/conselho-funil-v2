import Link from 'next/link';
import Image from 'next/image';

const links = {
  produto: [
    { label: 'Arsenal', href: '#arsenal' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  legal: [
    { label: 'Termos de Uso', href: '/terms' },
    { label: 'Privacidade', href: '/privacy' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Reembolso', href: '/refund' },
  ],
  suporte: [
    { label: 'support@mkthoney.com', href: 'mailto:support@mkthoney.com' },
  ],
};

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#0D0B09] py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Image
              src="/logo-mkthoney.svg"
              alt="MKTHONEY"
              width={140}
              height={32}
              className="mb-4"
            />
            <p className="text-xs text-zinc-600 max-w-xs leading-relaxed">
              Uma pessoa. Uma plataforma. Sem limites.
              <br />
              Marketing autônomo com inteligência artificial.
            </p>
          </div>

          {/* Produto */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-4">Produto</p>
            <ul className="space-y-2">
              {links.produto.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-xs text-zinc-500 hover:text-[#E6B447] transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-4">Legal</p>
            <ul className="space-y-2">
              {links.legal.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-xs text-zinc-500 hover:text-[#E6B447] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-4">Suporte</p>
            <ul className="space-y-2">
              {links.suporte.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-xs text-zinc-500 hover:text-[#E6B447] transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/[0.04] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © 2026 MKTHONEY. Todos os direitos reservados.
          </p>
          <p className="text-xs text-zinc-700">CNPJ: 62.625.246/0001-06</p>
        </div>
      </div>
    </footer>
  );
}
