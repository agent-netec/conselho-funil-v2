'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#como-funciona', label: 'Como Funciona' },
  { href: '#conselho', label: 'O Conselho' },
  { href: '#precos', label: 'Precos' },
  { href: '#faq', label: 'FAQ' },
];

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-[#0D0B09]/95 backdrop-blur-md border-b border-[#895F29]/20 py-3'
            : 'bg-transparent py-5'
        )}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/landing" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6B447]/10 border border-[#E6B447]/20">
                <span className="text-xl font-bold text-[#E6B447]">M</span>
              </div>
              <span className="text-xl font-bold text-[#F5E8CE]">MKTHONEY</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-[#CAB792] hover:text-[#E6B447] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm text-[#CAB792] hover:text-[#F5E8CE] transition-colors"
              >
                Entrar
              </Link>
              <Link href="/signup">
                <Button className="bg-[#E6B447] hover:bg-[#F0C35C] text-[#0D0B09] font-semibold px-6">
                  Criar Conta Gratis
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[#CAB792]"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-x-0 top-[72px] z-40 bg-[#0D0B09]/98 backdrop-blur-md border-b border-[#895F29]/20 md:hidden"
        >
          <div className="px-6 py-6 space-y-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-lg text-[#CAB792] hover:text-[#E6B447] transition-colors py-2"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 border-t border-[#895F29]/20 space-y-3">
              <Link
                href="/login"
                className="block text-center text-[#CAB792] py-2"
              >
                Entrar
              </Link>
              <Link href="/signup" className="block">
                <Button className="w-full bg-[#E6B447] hover:bg-[#F0C35C] text-[#0D0B09] font-semibold">
                  Criar Conta Gratis
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}
