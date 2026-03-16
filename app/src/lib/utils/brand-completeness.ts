import type { Brand } from '@/types/database';

export type ModalKey = 'logo' | 'visual' | 'rag' | 'ai';

export interface CompletenessResult {
  score: number;
  completedFields: string[];
  missingFields: { key: string; label: string; href?: string; modalKey?: ModalKey }[];
  label: string;
}

interface FieldCheck {
  key: string;
  weight: number;
  label: string;
  check: (brand: Brand) => boolean;
  href?: string;
  modalKey?: ModalKey;
}

export const FIELDS: FieldCheck[] = [
  {
    key: 'name',
    weight: 15,
    label: 'Nome da marca',
    check: (b) => !!b.name,
  },
  {
    key: 'audience',
    weight: 15,
    label: 'Publico-alvo',
    check: (b) => !!b.audience?.who && !!b.audience?.pain,
  },
  {
    key: 'offer',
    weight: 15,
    label: 'Oferta principal',
    check: (b) => !!b.offer?.what && b.offer?.ticket != null,
    href: '/edit',
  },
  {
    key: 'colors',
    weight: 10,
    label: 'Paleta de cores',
    check: (b) => !!b.brandKit?.colors?.primary,
    modalKey: 'visual',
  },
  {
    key: 'typography',
    weight: 5,
    label: 'Tipografia',
    check: (b) => !!b.brandKit?.typography?.primaryFont,
    modalKey: 'visual',
  },
  {
    key: 'logo',
    weight: 15,
    label: 'Logo oficial',
    check: (b) => !!b.brandKit?.logoLock?.variants?.primary?.url,
    modalKey: 'logo',
  },
  {
    key: 'aiConfig',
    weight: 10,
    label: 'Configuracao de IA',
    check: (b) => !!b.aiConfiguration?.profile,
    modalKey: 'ai',
  },
  {
    key: 'assets',
    weight: 15,
    label: 'Assets RAG',
    check: () => false, // Overridden by assetCount param
    modalKey: 'rag',
  },
];

export function calculateBrandCompleteness(
  brand: Brand,
  assetCount: number = 0
): CompletenessResult {
  const completedFields: string[] = [];
  const missingFields: { key: string; label: string; href?: string; modalKey?: ModalKey }[] = [];
  let score = 0;

  for (const field of FIELDS) {
    const isComplete = field.key === 'assets'
      ? assetCount > 0
      : field.check(brand);

    if (isComplete) {
      score += field.weight;
      completedFields.push(field.key);
    } else {
      missingFields.push({
        key: field.key,
        label: field.label,
        href: field.href,
        modalKey: field.modalKey,
      });
    }
  }

  return {
    score,
    completedFields,
    missingFields,
    label: `${score}% configurada`,
  };
}
