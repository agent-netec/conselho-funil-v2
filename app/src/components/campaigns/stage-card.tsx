import { motion } from 'framer-motion';
import { LucideIcon, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StageCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  status: 'empty' | 'generating' | 'ready' | 'approved';
  summary?: string[];
  onAction: () => void;
  actionLabel: string;
  isActive: boolean;
}

export function StageCard({
  title,
  description,
  icon: Icon,
  status,
  summary,
  onAction,
  actionLabel,
  isActive
}: StageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "card-premium p-6 transition-all duration-300 border-l-4",
        isActive ? "border-emerald-500 bg-emerald-500/[0.02]" : "border-transparent opacity-80",
        status === 'ready' && !isActive && "border-blue-500/50"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-xl",
            isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
          )}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">{title}</h3>
            <p className="text-sm text-zinc-500">{description}</p>
          </div>
        </div>
        
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
          status === 'approved' ? "bg-emerald-500/10 text-emerald-400" :
          status === 'ready' ? "bg-blue-500/10 text-blue-400" :
          status === 'generating' ? "bg-amber-500/10 text-amber-400 animate-pulse" :
          "bg-zinc-800 text-zinc-500"
        )}>
          {status === 'approved' ? 'Aprovado' :
           status === 'ready' ? 'Pronto' :
           status === 'generating' ? 'Gerando...' :
           'Pendente'}
        </div>
      </div>

      <div className="min-h-[100px] mb-6">
        {summary && summary.length > 0 ? (
          <ul className="space-y-2">
            {summary.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                <ChevronRight className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-4 text-center">
            <AlertCircle className="h-8 w-8 text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-600 italic">
              Aguardando conclusão da etapa anterior
            </p>
          </div>
        )}
      </div>

      <Button
        onClick={onAction}
        disabled={status === 'generating' || (!isActive && status === 'empty')}
        className={cn(
          "w-full font-bold uppercase tracking-wider text-xs h-10 transition-all",
          isActive 
            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
            : "btn-ghost border-zinc-800 text-zinc-500"
        )}
      >
        {status === 'generating' ? (
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
            Consultando Conselho...
          </div>
        ) : (
          <>
            {actionLabel}
            <ChevronRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </motion.div>
  );
}
