'use client';

import { useCallback } from 'react';
import type { Attachment } from './use-file-upload';

export interface SendMessageOptions {
  attachments?: Attachment[];
  partyMode?: boolean;
  selectedAgents?: string[];
  intensity?: string;
}

export interface UseChatMessageReturn {
  buildMessage: (
    content: string,
    options?: SendMessageOptions
  ) => { finalMessage: string; sendOptions?: { selectedAgents?: string[]; intensity?: 'debate' | 'consensus' } };
}

/**
 * Hook that builds the final message payload with attachment context injection
 * and party-mode options. The actual send is delegated to the parent's onSend callback.
 */
export function useChatMessage(): UseChatMessageReturn {
  const buildMessage = useCallback(
    (
      content: string,
      options?: SendMessageOptions
    ): {
      finalMessage: string;
      sendOptions?: {
        selectedAgents?: string[];
        intensity?: 'debate' | 'consensus';
      };
    } => {
      let finalMessage = content.trim();

      // Inject attachment insights if present
      const readyAttachments = (options?.attachments ?? []).filter(
        (a) => a.status === 'ready' && a.insight
      );

      if (readyAttachments.length > 0) {
        const insightsContext = readyAttachments
          .map(
            (a) =>
              `--- REFERÊNCIA ANEXADA: ${a.file.name} ---\n${a.insight}`
          )
          .join('\n\n');

        finalMessage = `[CONTEXTO DE ANEXOS]:\n${insightsContext}\n\n---\n\nPERGUNTA DO USUÁRIO: ${finalMessage || '(Análise de referência enviada)'}`;
      }

      // Build party-mode options
      if (options?.partyMode && options.selectedAgents) {
        return {
          finalMessage,
          sendOptions: {
            selectedAgents: options.selectedAgents,
            intensity: (options.intensity as 'debate' | 'consensus') ?? 'debate',
          },
        };
      }

      return { finalMessage };
    },
    []
  );

  return { buildMessage };
}
