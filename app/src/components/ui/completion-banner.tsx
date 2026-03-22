'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CompletionBannerProps {
  title: string;
  description: string;
  cta: string;
  href: string;
  icon?: React.ReactNode;
}

export function CompletionBanner({ title, description, cta, href, icon }: CompletionBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-[#7A9B5A]/20 bg-[#7A9B5A]/5 p-4 flex items-center gap-4"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7A9B5A]/10 flex-shrink-0">
        {icon || <CheckCircle2 className="h-5 w-5 text-[#7A9B5A]" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#F5E8CE]">{title}</p>
        <p className="text-xs text-[#CAB792] mt-0.5">{description}</p>
      </div>

      <Button asChild size="sm" className="bg-gradient-to-r from-[#E6B447] to-[#AB8648] text-[#0D0B09] font-semibold hover:from-[#F0C35C] hover:to-[#E6B447] flex-shrink-0">
        <Link href={href}>
          {cta}
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Link>
      </Button>
    </motion.div>
  );
}
