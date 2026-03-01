'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '#arsenal', label: 'Arsenal' },
  { href: '#filosofia', label: 'Filosofia' },
  { href: '#how-it-works', label: 'Protocolo' },
  { href: '#pricing', label: 'O Preço' },
  { href: '#faq', label: 'FAQ' },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#0D0B09]/80 backdrop-blur-md border-b border-white/[0.04]">
      <nav className="mx-auto max-w-7xl px-6 lg:px-12 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/landing" className="flex items-center">
          <Image
            src="/logo-mkthoney.svg"
            alt="MKTHONEY"
            width={140}
            height={32}
            priority
          />
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-sm text-zinc-400 hover:text-[#E6B447] transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[#E6B447] px-4 py-2 text-sm font-semibold text-[#0D0B09] hover:bg-[#F0C35C] transition-colors"
          >
            Iniciar Guerra →
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-zinc-400 hover:text-white"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/[0.04] bg-[#0D0B09]/95 backdrop-blur-md px-6 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block text-sm text-zinc-400 hover:text-[#E6B447] transition-colors py-2.5"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-4 border-t border-white/[0.04] space-y-3">
            <Link
              href="/login"
              className="block text-center text-sm text-zinc-400 hover:text-white py-2 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="block w-full text-center rounded-lg bg-[#E6B447] px-4 py-2.5 text-sm font-semibold text-[#0D0B09] hover:bg-[#F0C35C] transition-colors"
            >
              Iniciar Guerra →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
