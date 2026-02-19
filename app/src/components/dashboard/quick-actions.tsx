'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, Zap, ArrowUpRight } from 'lucide-react';

interface ActionCardProps {
  href: string;
  icon: any;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}

function ActionCard({ 
  href, 
  icon: Icon, 
  title, 
  description, 
  gradient,
  delay = 0 
}: ActionCardProps) {
  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        whileHover={{ y: -4 }}
        className="group relative h-full"
      >
        <div className="card-premium card-hover h-full p-6">
          <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient} blur-2xl -z-10`} />
          
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${gradient.replace('blur-2xl', '')} bg-opacity-20`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
              {title}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          </div>
          
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Acessar
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export function QuickActions() {
  return (
    <motion.div 
      className="mb-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-white">Ações Rápidas</h3>
      </div>
      
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          href="/funnels/new"
          icon={Zap}
          title="Nova Campanha"
          description="Inicie a Golden Thread: Funil ao Ads"
          gradient="bg-gradient-to-br from-amber-500/20 to-orange-600/20"
          delay={0.25}
        />
        <ActionCard
          href="/funnels/new"
          icon={Plus}
          title="Novo Funil"
          description="Crie um funil do zero com ajuda do Conselho"
          gradient="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20"
          delay={0.3}
        />
        <ActionCard
          href="/chat"
          icon={MessageSquare}
          title="Consultar Conselho"
          description="Tire dúvidas com os 23 especialistas"
          gradient="bg-gradient-to-br from-blue-500/20 to-blue-600/20"
          delay={0.35}
        />
        <ActionCard
          href="/library"
          icon={Zap}
          title="Biblioteca"
          description="Acesse templates e cases de sucesso"
          gradient="bg-gradient-to-br from-purple-500/20 to-indigo-600/20"
          delay={0.4}
        />
      </div>
    </motion.div>
  );
}



