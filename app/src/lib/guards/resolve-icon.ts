import type { ComponentType } from 'react';

type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>;

export function resolveIcon<Map extends Record<string, IconComponent>>(
  map: Map,
  key: string | undefined,
  fallback: IconComponent,
  context?: string
): IconComponent {
  if (!key || !(key in map)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[IconMap] Chave de icone invalida "${key ?? 'undefined'}"${context ? ` em ${context}` : ''}.`
      );
    }
    return fallback;
  }

  return map[key];
}
