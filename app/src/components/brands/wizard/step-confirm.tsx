import { motion } from 'framer-motion';
import { Building2, Users, Package, Palette, Image, BrainCircuit, Sparkles } from 'lucide-react';

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
    colors: { primary: string; secondary: string; accent: string; background: string };
    visualStyle: string;
    typography: { primaryFont: string; secondaryFont: string };
    logoFile: File | null;
    logoLocked: boolean;
    aiProfile: string;
  };
}

const VOICE_TONE_LABELS: Record<string, string> = {
  professional: 'Profissional',
  casual: 'Casual',
  authoritative: 'Autoritario',
  friendly: 'Amigavel',
  inspirational: 'Inspirador',
};

const AWARENESS_LABELS: Record<string, string> = {
  unaware: 'Nao sabe que tem problema',
  problem_aware: 'Sabe que tem problema',
  solution_aware: 'Busca solucoes',
  product_aware: 'Conhece seu produto',
};

const OFFER_TYPE_LABELS: Record<string, string> = {
  course: 'Curso/Infoproduto',
  saas: 'SaaS/Software',
  service: 'Servico',
  mentorship: 'Mentoria/Consultoria',
  physical: 'Produto Fisico',
  subscription: 'Assinatura',
};

const STYLE_LABELS: Record<string, string> = {
  minimalist: 'Minimalista',
  aggressive: 'Agressivo',
  luxury: 'Luxo',
  corporate: 'Corporativo',
  modern: 'Moderno',
};

const AI_PROFILE_LABELS: Record<string, string> = {
  equilibrado: 'Equilibrado',
  criativo: 'Criativo',
  agressivo: 'Agressivo',
  sobrio: 'Sobrio',
};

function NotConfiguredBadge() {
  return (
    <span className="text-xs text-zinc-600 italic">
      Nao configurado — voce pode fazer isso depois no Brand Hub
    </span>
  );
}

export function StepConfirm({ formData }: StepConfirmProps) {
  const hasColors = formData.colors.primary !== '#10b981' || formData.colors.secondary !== '#3b82f6';
  const hasTypography = formData.typography.primaryFont !== 'Inter' || formData.typography.secondaryFont !== 'Inter';
  const hasVisual = hasColors || hasTypography;

  return (
    <motion.div
      key="step7"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 mb-3">
          <Sparkles className="w-7 h-7 text-emerald-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-1">
          Revise sua Marca
        </h3>
        <p className="text-sm text-zinc-500">
          Confirme se todas as informacoes estao corretas antes de criar
        </p>
      </div>

      {/* Identidade */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <Building2 className="h-4 w-4 text-emerald-500" />
          </div>
          <h4 className="font-medium text-white text-sm">Identidade</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-zinc-500 text-xs">Nome:</span>
            <p className="text-white">{formData.name}</p>
          </div>
          <div>
            <span className="text-zinc-500 text-xs">Vertical:</span>
            <p className="text-white">{formData.vertical}</p>
          </div>
          <div className="col-span-2">
            <span className="text-zinc-500 text-xs">Posicionamento:</span>
            <p className="text-white">{formData.positioning}</p>
          </div>
          <div>
            <span className="text-zinc-500 text-xs">Tom de Voz:</span>
            <p className="text-white">{VOICE_TONE_LABELS[formData.voiceTone] || formData.voiceTone}</p>
          </div>
        </div>
      </div>

      {/* Publico */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <h4 className="font-medium text-white text-sm">Publico-Alvo</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-zinc-500 text-xs">Cliente Ideal:</span>
            <p className="text-white">{formData.who}</p>
          </div>
          <div>
            <span className="text-zinc-500 text-xs">Dor Principal:</span>
            <p className="text-white">{formData.pain}</p>
          </div>
          <div>
            <span className="text-zinc-500 text-xs">Consciencia:</span>
            <p className="text-white">{AWARENESS_LABELS[formData.awareness] || formData.awareness}</p>
          </div>
          {formData.objections.filter(o => o.trim()).length > 0 && (
            <div>
              <span className="text-zinc-500 text-xs">Objecoes:</span>
              <ul className="text-white mt-1">
                {formData.objections.filter(o => o.trim()).map((obj, i) => (
                  <li key={i} className="text-sm">• {obj}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Oferta */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
            <Package className="h-4 w-4 text-purple-500" />
          </div>
          <h4 className="font-medium text-white text-sm">Oferta Principal</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">
            <span className="text-zinc-500 text-xs">Produto/Servico:</span>
            <p className="text-white">{formData.what}</p>
          </div>
          <div>
            <span className="text-zinc-500 text-xs">Ticket:</span>
            <p className="text-white font-medium">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(formData.ticket) || 0)}
            </p>
          </div>
          <div>
            <span className="text-zinc-500 text-xs">Tipo:</span>
            <p className="text-white">{OFFER_TYPE_LABELS[formData.type] || formData.type}</p>
          </div>
          <div className="col-span-2">
            <span className="text-zinc-500 text-xs">Diferencial:</span>
            <p className="text-white">{formData.differentiator}</p>
          </div>
        </div>
      </div>

      {/* Visual Identity */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <Palette className="h-4 w-4 text-amber-500" />
          </div>
          <h4 className="font-medium text-white text-sm">Identidade Visual</h4>
        </div>
        {hasVisual ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-xs">Cores:</span>
              <div className="flex gap-1">
                {Object.values(formData.colors).map((color, i) => (
                  <div key={i} className="h-5 w-5 rounded border border-white/10" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div>
              <span className="text-zinc-500 text-xs">Estilo:</span>
              <span className="text-white ml-2">{STYLE_LABELS[formData.visualStyle] || formData.visualStyle}</span>
            </div>
            {hasTypography && (
              <div>
                <span className="text-zinc-500 text-xs">Fontes:</span>
                <span className="text-white ml-2">{formData.typography.primaryFont} / {formData.typography.secondaryFont}</span>
              </div>
            )}
          </div>
        ) : (
          <NotConfiguredBadge />
        )}
      </div>

      {/* Logo */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
            <Image className="h-4 w-4 text-cyan-500" />
          </div>
          <h4 className="font-medium text-white text-sm">Logo</h4>
        </div>
        {formData.logoFile ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-white">{formData.logoFile.name}</span>
            <span className="text-[10px] text-zinc-600">
              ({(formData.logoFile.size / 1024).toFixed(0)}KB)
            </span>
            {formData.logoLocked && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">LOCKED</span>
            )}
          </div>
        ) : (
          <NotConfiguredBadge />
        )}
      </div>

      {/* AI Config */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
            <BrainCircuit className="h-4 w-4 text-purple-400" />
          </div>
          <h4 className="font-medium text-white text-sm">Personalidade da IA</h4>
        </div>
        <div className="text-sm">
          <span className="text-white">{AI_PROFILE_LABELS[formData.aiProfile] || formData.aiProfile}</span>
        </div>
      </div>

      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
        <p className="text-xs text-emerald-200/80 text-center">
          Este contexto sera usado por todos os conselhos (Funil, Copy e Social)
          para gerar estrategias alinhadas com sua marca.
        </p>
      </div>
    </motion.div>
  );
}
