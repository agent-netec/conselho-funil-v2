import { motion } from 'framer-motion';
import { Building2, Users, Package, Palette, FileText, Sparkles } from 'lucide-react';

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
    colors?: { primary: string; secondary: string; accent: string; background: string };
    visualStyle?: string;
    typography?: { primaryFont: string; secondaryFont: string };
    logoFile?: File | null;
    logoLocked?: boolean;
    queuedDocuments?: File[];
  };
}

const VOICE_TONE_LABELS: Record<string, string> = {
  professional: 'Profissional',
  casual: 'Casual',
  authoritative: 'Autoritário',
  friendly: 'Amigável',
  inspirational: 'Inspirador',
};

const AWARENESS_LABELS: Record<string, string> = {
  unaware: 'Não sabe que tem problema',
  problem_aware: 'Sabe que tem problema',
  solution_aware: 'Busca soluções',
  product_aware: 'Conhece seu produto',
};

const OFFER_TYPE_LABELS: Record<string, string> = {
  course: 'Curso Online', mentorship: 'Mentoria', consultancy: 'Consultoria',
  saas: 'SaaS/App', ebook: 'E-book/Digital', service: 'Serviço',
  physical: 'Produto Físico', community: 'Comunidade', event: 'Evento/Workshop',
  subscription: 'Assinatura', franchise: 'Franquia',
};

const STYLE_LABELS: Record<string, string> = {
  minimalist: 'Minimalista', aggressive: 'Agressivo', luxury: 'Luxo',
  corporate: 'Corporativo', modern: 'Moderno',
};

function NotConfiguredBadge() {
  return (
    <span className="text-xs text-zinc-600 italic">
      Não configurado — você pode fazer isso depois
    </span>
  );
}

export function StepConfirm({ formData }: StepConfirmProps) {
  const hasColors = (formData.colors?.primary ?? '#E6B447') !== '#E6B447' || (formData.colors?.secondary ?? '#3b82f6') !== '#3b82f6';
  const hasTypography = (formData.typography?.primaryFont ?? 'Inter') !== 'Inter';
  const hasVisual = hasColors || hasTypography;
  const docCount = formData.queuedDocuments?.length || 0;

  return (
    <motion.div
      key="step6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E6B447]/10 mb-3">
          <Sparkles className="w-7 h-7 text-[#E6B447]" />
        </div>
        <h3 className="text-lg font-medium text-white mb-1">Revise sua Marca</h3>
        <p className="text-sm text-zinc-500">Confirme se tudo está correto antes de criar</p>
      </div>

      {/* Identity */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6B447]/10">
            <Building2 className="h-4 w-4 text-[#E6B447]" />
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

      {/* Audience */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <h4 className="font-medium text-white text-sm">Público-Alvo</h4>
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
            <span className="text-zinc-500 text-xs">Consciência:</span>
            <p className="text-white">{AWARENESS_LABELS[formData.awareness] || formData.awareness}</p>
          </div>
          {formData.objections.filter(o => o.trim()).length > 0 && (
            <div>
              <span className="text-zinc-500 text-xs">Objeções:</span>
              <ul className="text-white mt-1">
                {formData.objections.filter(o => o.trim()).map((obj, i) => (
                  <li key={i} className="text-sm">• {obj}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Offer */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6B447]/10">
            <Package className="h-4 w-4 text-[#E6B447]" />
          </div>
          <h4 className="font-medium text-white text-sm">Oferta Principal</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">
            <span className="text-zinc-500 text-xs">Produto/Serviço:</span>
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

      {/* Visual + Logo */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <Palette className="h-4 w-4 text-amber-500" />
          </div>
          <h4 className="font-medium text-white text-sm">Visual + Logo</h4>
        </div>
        {hasVisual || formData.logoFile ? (
          <div className="space-y-2 text-sm">
            {formData.colors && hasColors && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-xs">Cores:</span>
                <div className="flex gap-1">
                  {Object.values(formData.colors).map((color, i) => (
                    <div key={i} className="h-5 w-5 rounded border border-white/10" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            )}
            {formData.visualStyle && (
              <div><span className="text-zinc-500 text-xs">Estilo:</span> <span className="text-white ml-1">{STYLE_LABELS[formData.visualStyle] || formData.visualStyle}</span></div>
            )}
            {hasTypography && formData.typography && (
              <div><span className="text-zinc-500 text-xs">Fontes:</span> <span className="text-white ml-1">{formData.typography.primaryFont} / {formData.typography.secondaryFont}</span></div>
            )}
            {formData.logoFile && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-xs">Logo:</span>
                <span className="text-white">{formData.logoFile.name}</span>
                {formData.logoLocked && <span className="text-[10px] bg-[#E6B447]/10 text-[#E6B447] px-2 py-0.5 rounded">LOCKED</span>}
              </div>
            )}
          </div>
        ) : (
          <NotConfiguredBadge />
        )}
      </div>

      {/* Documents */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
            <FileText className="h-4 w-4 text-cyan-500" />
          </div>
          <h4 className="font-medium text-white text-sm">Documentos</h4>
        </div>
        {docCount > 0 ? (
          <p className="text-sm text-white">{docCount} arquivo(s) para upload</p>
        ) : (
          <NotConfiguredBadge />
        )}
      </div>

      <div className="rounded-lg border border-[#E6B447]/20 bg-[#E6B447]/5 p-3">
        <p className="text-xs text-zinc-400 text-center">
          Este contexto será usado por todos os conselheiros (Copy, Social, Design, Ads) para gerar estratégias alinhadas com sua marca.
        </p>
      </div>
    </motion.div>
  );
}
