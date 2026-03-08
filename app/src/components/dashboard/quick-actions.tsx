'use client';

import Link from 'next/link';
import { Plus, MessageSquare, Zap, BookOpen, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ACTIONS = [
  {
    href: '/funnels/new',
    icon: Zap,
    label: 'Nova Campanha',
    description: 'Golden Thread: Funil ao Ads',
    color: 'text-[#E6B447]',
    bg: 'bg-[#E6B447]/10',
  },
  {
    href: '/funnels/new',
    icon: Plus,
    label: 'Novo Funil',
    description: 'Criar com ajuda do MKTHONEY',
    color: 'text-[#E6B447]',
    bg: 'bg-[#E6B447]/10',
  },
  {
    href: '/chat',
    icon: MessageSquare,
    label: 'Consultar MKTHONEY',
    description: '23 especialistas',
    color: 'text-[#5B8EC4]',
    bg: 'bg-[#5B8EC4]/10',
  },
  {
    href: '/assets',
    icon: BookOpen,
    label: 'Biblioteca',
    description: 'Ativos vetorizados',
    color: 'text-[#AB8648]',
    bg: 'bg-[#AB8648]/10',
  },
];

export function QuickActions() {
  return (
    <Card className="border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none">
      <CardContent className="p-0">
        <div className="px-4 pt-4 pb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#AB8648]">
            Acoes Rapidas
          </span>
        </div>

        <div className="divide-y divide-[#2A2318]">
          {ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#241F19]"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.bg} flex-shrink-0`}
              >
                <action.icon className={`h-4 w-4 ${action.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-[#F5E8CE] group-hover:text-[#E6B447] transition-colors truncate">
                  {action.label}
                </span>
                <span className="block text-[11px] text-[#6B5D4A] truncate">
                  {action.description}
                </span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-[#3D3428] group-hover:text-[#E6B447] transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
