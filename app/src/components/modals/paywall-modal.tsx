'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Crown, CheckCircle2, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaywallModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaywallModal({ isOpen, onOpenChange }: PaywallModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-[#0c0c0e] border-white/[0.08] p-0 overflow-hidden">
        <div className="relative p-6 pt-10">
          {/* Background Gradient Decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-violet-600/20 to-transparent blur-2xl" />
          
          <DialogHeader className="relative text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/20">
              <Crown className="h-8 w-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-white text-center">
                Você atingiu o limite de créditos
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-center text-base">
                Sua conta gratuita possui 10 créditos mensais. Faça o upgrade agora para continuar gerando estratégias ilimitadas.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="mt-8 space-y-4">
            <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider text-center">
              Vantagens do Plano Pro
            </h4>
            
            <div className="grid gap-3">
              {[
                "Créditos ilimitados para o Conselho",
                "Acesso a todos os 15 especialistas",
                "Upload de arquivos e URLs (Contexto Ilimitado)",
                "Exportação em PDF e Notion"
              ].map((benefit, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-zinc-300">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-white/[0.02] border-t border-white/[0.04] flex-col sm:flex-col gap-3">
          <Button 
            className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-violet-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => window.open('https://conselho-de-funil.vercel.app/pricing', '_blank')}
          >
            Ver Planos de Upgrade
          </Button>
          
          <button 
            className="flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors py-2"
            onClick={() => window.open('https://wa.me/seunumerodesuporte', '_blank')}
          >
            <MessageCircle className="h-4 w-4" />
            Falar com suporte
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}






