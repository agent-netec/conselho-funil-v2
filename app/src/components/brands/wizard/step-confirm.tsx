import { motion } from 'framer-motion';
import { Building2, Users, Package, Sparkles } from 'lucide-react';

interface StepConfirmProps {
  formData: {
    name: string;
    vertical: string;
    positioning: string;
    voiceTone: string;
    who: string;
    pain: string;
    awareness: string;
    objections: string[];
    what: string;
    ticket: string;
    type: string;
    differentiator: string;
  };
}

const VOICE_TONE_LABELS: Record<string, string> = {
  professional: 'Profissional 👔',
  casual: 'Casual 😊',
  authoritative: 'Autoritário 🎯',
  friendly: 'Amigável 🤝',
  inspirational: 'Inspirador ✨',
};

const AWARENESS_LABELS: Record<string, string> = {
  unaware: 'Não sabe que tem problema',
  problem_aware: 'Sabe que tem problema',
  solution_aware: 'Busca soluções',
  product_aware: 'Conhece seu produto',
};

const OFFER_TYPE_LABELS: Record<string, string> = {
  course: 'Curso/Infoproduto',
  saas: 'SaaS/Software',
  service: 'Serviço',
  mentorship: 'Mentoria/Consultoria',
  physical: 'Produto Físico',
  subscription: 'Assinatura',
};

export function StepConfirm({ formData }: StepConfirmProps) {
  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-4">
          <Sparkles className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          Revise sua Marca
        </h3>
        <p className="text-sm text-zinc-500">
          Confirme se todas as informações estão corretas antes de criar
        </p>
      </div>

      {/* Identidade */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <Building2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h4 className="font-medium text-white">Identidade</h4>
            <p className="text-xs text-zinc-500">Nome e posicionamento</p>
          </div>
        </div>
        
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-zinc-500">Nome:</span>
            <p className="text-white font-medium">{formData.name}</p>
          </div>
          <div>
            <span className="text-zinc-500">Vertical:</span>
            <p className="text-white">{formData.vertical}</p>
          </div>
          <div>
            <span className="text-zinc-500">Posicionamento:</span>
            <p className="text-white">{formData.positioning}</p>
          </div>
          <div>
            <span className="text-zinc-500">Tom de Voz:</span>
            <p className="text-white">{VOICE_TONE_LABELS[formData.voiceTone] || formData.voiceTone}</p>
          </div>
        </div>
      </div>

      {/* Público */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h4 className="font-medium text-white">Público-Alvo</h4>
            <p className="text-xs text-zinc-500">Quem você serve</p>
          </div>
        </div>
        
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-zinc-500">Cliente Ideal:</span>
            <p className="text-white">{formData.who}</p>
          </div>
          <div>
            <span className="text-zinc-500">Dor Principal:</span>
            <p className="text-white">{formData.pain}</p>
          </div>
          <div>
            <span className="text-zinc-500">Nível de Consciência:</span>
            <p className="text-white">{AWARENESS_LABELS[formData.awareness] || formData.awareness}</p>
          </div>
          {formData.objections.filter(o => o.trim()).length > 0 && (
            <div>
              <span className="text-zinc-500">Objeções:</span>
              <ul className="text-white mt-1 space-y-1">
                {formData.objections.filter(o => o.trim()).map((obj, i) => (
                  <li key={i} className="text-sm">• {obj}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Oferta */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <Package className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h4 className="font-medium text-white">Oferta Principal</h4>
            <p className="text-xs text-zinc-500">O que você vende</p>
          </div>
        </div>
        
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-zinc-500">Produto/Serviço:</span>
            <p className="text-white">{formData.what}</p>
          </div>
          <div>
            <span className="text-zinc-500">Ticket Médio:</span>
            <p className="text-white font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(Number(formData.ticket) || 0)}
            </p>
          </div>
          <div>
            <span className="text-zinc-500">Tipo:</span>
            <p className="text-white">{OFFER_TYPE_LABELS[formData.type] || formData.type}</p>
          </div>
          <div>
            <span className="text-zinc-500">Diferencial:</span>
            <p className="text-white">{formData.differentiator}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-200/80 text-center">
          ✨ Este contexto será usado por todos os conselhos (Funil, Copy e Social) 
          para gerar estratégias alinhadas com sua marca.
        </p>
      </div>
    </motion.div>
  );
}






