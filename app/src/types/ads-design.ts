import { z } from 'zod';

/**
 * Ads Design Engine (NanoBanana) Contract
 * ID: ST-11.9
 */

export const AdsDesignSchema = z.object({
  objective: z.enum(['venda', 'engajamento', 'branding', 'conversao']).optional(),
  platform: z.enum(['meta', 'google', 'linkedin', 'universal']),
  format: z.enum(['square', 'landscape', 'vertical', 'portrait']),
  safeZone: z.enum(['feed', 'stories', 'reels', 'search', 'display']),
  assets: z.object({
    primaryText: z.string().optional(),
    headline: z.string().optional(),
    description: z.string().optional(),
    callToAction: z.string().optional(),
    headlines: z.array(z.string()).optional(),
    descriptions: z.array(z.string()).optional(),
  }),
  visualPrompt: z.string(),
  aspectRatio: z.enum(['1:1', '16:9', '4:5', '9:16', '1.91:1']),
  brandContext: z.object({
    colors: z.array(z.string()),
    style: z.string(),
    logoUsage: z.string().optional(),
  }),
  strategy: z.object({
    contrastFocus: z.string(),
    hierarchyOrder: z.array(z.string()),
    anthropomorphism: z.string().optional(),
    proximityLogic: z.string(),
    balanceType: z.enum(['symmetrical', 'asymmetrical']),
    unityTheme: z.string(),
  }),
});

export type AdsDesignContract = z.infer<typeof AdsDesignSchema>;
