'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Check, Copy, Gavel, Share2, ArrowRight, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { CounselorBadges, SourcesList } from './counselor-badges';
import { DesignGenerationCard } from './design-generation-card';
import { AssetPreview } from '../council/asset-preview';
import { cn } from '@/lib/utils';
import { parsePartyResponse, PartySection, getInteractionSummary } from '@/lib/utils/party-parser';
import { COUNSELORS_REGISTRY } from '@/lib/constants';

export interface MessageData {
  id: string;
  role: string;
  content: string;
  createdAt?: {
    toDate: () => Date;
  };
  metadata?: {
    sources?: Array<{ file: string; section?: string; counselor?: string; similarity?: number }>;
    counselors?: string[];
  };
}

interface ChatMessageBubbleProps {
  message: MessageData;
  index: number;
  campaignId?: string | null;
}

export function ChatMessageBubble({ 
  message, 
  index,
  campaignId
}: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  // US-1.5.2: Detecção de Output Estruturado do Conselho (Extração Robusta ST-11.6)
  const detectCouncilOutput = (content: string) => {
    const marker = '[COUNCIL_OUTPUT]:';
    if (!content.includes(marker)) return null;

    try {
      const startIndex = content.indexOf(marker);
      const startOfJson = content.indexOf('{', startIndex);
      if (startOfJson === -1) return null;

      let braceCount = 0;
      let inString = false;
      let escape = false;
      let jsonStr = null;

      for (let i = startOfJson; i < content.length; i++) {
        const char = content[i];
        if (escape) { escape = false; continue; }
        if (char === '\\') { escape = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        
        if (!inString) {
          if (char === '{') braceCount++;
          else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              jsonStr = content.substring(startOfJson, i + 1);
              break;
            }
          }
        }
      }

      if (jsonStr) {
        let cleanedJson = jsonStr
          .replace(/,\s*([}\]])/g, '$1') // Remove vírgulas pendentes
          .replace(/(\r\n|\n|\r)/gm, " "); // Transforma quebras em espaços
          
        return JSON.parse(cleanedJson);
      }
    } catch (e) {
      console.warn('Council output found but could not be parsed as valid JSON.', e);
    }
    return null;
  };

  // US-20.3: Detecção de Prompts do NanoBanana (Plural)
  const detectNanobananaPrompts = (content: string) => {
    if (!content.includes('[NANOBANANA_PROMPT]')) return [];

    const prompts: any[] = [];
    const marker = '[NANOBANANA_PROMPT]';
    
    try {
      let searchIndex = 0;
      while ((searchIndex = content.indexOf(marker, searchIndex)) !== -1) {
        const startOfJson = content.indexOf('{', searchIndex);
        if (startOfJson === -1) {
          searchIndex += marker.length;
          continue;
        }

        // Extração Robusta: Encontrar o fechamento balanceado das chaves
        let braceCount = 0;
        let inString = false;
        let escape = false;
        let jsonStr = null;

        for (let i = startOfJson; i < content.length; i++) {
          const char = content[i];
          if (escape) { escape = false; continue; }
          if (char === '\\') { escape = true; continue; }
          if (char === '"') { inString = !inString; continue; }
          
          if (!inString) {
            if (char === '{') braceCount++;
            else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                jsonStr = content.substring(startOfJson, i + 1);
                searchIndex = i + 1;
                break;
              }
            }
          }
        }

        if (jsonStr) {
          try {
            // Limpeza agressiva para JSON de IA
            let cleanedJson = jsonStr
              .replace(/```json/g, '').replace(/```/g, '') // Remove markdown
              .replace(/,\s*([}\]])/g, '$1') // Remove vírgulas pendentes
              .replace(/(\r\n|\n|\r)/gm, " "); // Transforma quebras em espaços para evitar erros de string

            // Tenta parsear
            const parsed = JSON.parse(cleanedJson);
            // ST-11.9: Suporte a visualPrompt (novo contrato) ou prompt (legado)
            if (parsed.visualPrompt || parsed.prompt) {
              prompts.push(parsed);
            }
          } catch (e) {
            console.warn('Falha ao parsear bloco extraído:', jsonStr);
            // Fallback: Se falhou o parse mas temos o texto, tenta extrator via regex campo a campo
            const extractField = (field: string, source: string) => {
              const regex = new RegExp(`"${field}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*[,}])`);
              const m = source.match(regex);
              return m ? m[1].trim() : null;
            };
            const p = extractField('visualPrompt', jsonStr) || extractField('prompt', jsonStr);
            if (p) {
              prompts.push({
                platform: extractField('platform', jsonStr) || 'universal',
                format: extractField('format', jsonStr) || 'square',
                safeZone: extractField('safeZone', jsonStr) || 'feed',
                visualPrompt: p.replace(/\\"/g, '"'),
                prompt: p.replace(/\\"/g, '"'), // Retrocompatibilidade para o card
                aspectRatio: extractField('aspectRatio', jsonStr) || '1:1'
              });
            }
          }
        } else {
          searchIndex += marker.length;
        }
      }
    } catch (e) {
      console.warn('Erro geral na detecção de prompts NanoBanana.', e);
    }
    
    return prompts;
  };

  const nanobananaPrompts = !isUser ? detectNanobananaPrompts(message.content) : [];
  const councilOutput = !isUser ? detectCouncilOutput(message.content) : null;
  const partySections = !isUser ? parsePartyResponse(message.content) : [];
  const interactions = !isUser ? getInteractionSummary(partySections) : [];

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className={cn(
        'group flex gap-3 sm:gap-4 px-3 sm:px-6 py-4 sm:py-5 border-b border-white/[0.02]',
        isUser ? 'bg-transparent' : 'bg-white/[0.01]'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 pt-0.5">
        {isUser ? (
          <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-zinc-800 text-sm font-medium text-zinc-300 shadow-sm">
            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        ) : (
          <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/10">
            <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[13px] sm:text-sm font-semibold text-zinc-300">
              {isUser ? 'Você' : 'Conselho'}
            </span>
            {message.createdAt && (
              <span className="text-[10px] sm:text-xs text-zinc-600 font-medium">
                {message.createdAt.toDate?.().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        
        {/* Message Content - Markdown or Text */}
        <div className="text-[15px] sm:text-base leading-relaxed text-zinc-200">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="space-y-4">
              {/* Interaction Map Summary (ST-6.4) */}
              {interactions.length > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-y-2 gap-x-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] shadow-sm">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest border-r border-white/10 pr-3">
                    <Share2 className="h-3 w-3" />
                    <span>Fluxo de Debate</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {interactions.map((interaction, i) => {
                      const from = COUNSELORS_REGISTRY[interaction.from];
                      return (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="text-xs" title={from.name}>{from.icon}</span>
                          <ArrowRight className="h-2 w-2 text-zinc-600" />
                          <div className="flex -space-x-1">
                            {interaction.to.map(toId => {
                              const to = COUNSELORS_REGISTRY[toId];
                              return (
                                <span key={toId} className="text-xs" title={to.name}>{to.icon}</span>
                              );
                            })}
                          </div>
                          {i < interactions.length - 1 && <div className="h-3 w-px bg-white/10 mx-1" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {partySections.length > 0 ? (
                partySections.map((section, idx) => {
                  if (section.type === 'header') {
                    return (
                      <h3 key={idx} className="text-lg font-bold text-white flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                        {section.content.replace('###', '').trim()}
                      </h3>
                    );
                  }

                  if (section.type === 'agent') {
                    const agent = section.agentId ? COUNSELORS_REGISTRY[section.agentId] : null;
                    const color = agent?.color || '#10b981'; // Fallback to emerald
                    const icon = agent?.icon || '💬';

                    return (
                      <div key={idx} className="relative group/agent pl-4 border-l-2" style={{ borderLeftColor: color }}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{icon}</span>
                            <span className="font-bold text-sm uppercase tracking-wider" style={{ color }}>
                              {section.agentName}
                            </span>
                          </div>

                          {/* Menções / Flow Indicator */}
                          {section.mentions && section.mentions.length > 0 && (
                            <div className="flex items-center gap-1.5 opacity-60 group-hover/agent:opacity-100 transition-opacity">
                              <div className="flex -space-x-2">
                                {section.mentions.map(mId => {
                                  const m = COUNSELORS_REGISTRY[mId];
                                  return (
                                    <div 
                                      key={mId} 
                                      className="h-5 w-5 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px]"
                                      title={`Citando ${m?.name}`}
                                    >
                                      {m?.icon}
                                    </div>
                                  );
                                })}
                              </div>
                              <Share2 className="h-3 w-3 text-zinc-500" />
                            </div>
                          )}
                        </div>
                        <MarkdownRenderer 
                          content={section.content} 
                          components={{
                            strong: ({ node, ...props }: any) => {
                              const text = props.children?.toString() || '';
                              // Busca se o texto em negrito é o nome de algum conselheiro
                              const mentionedAgent = Object.values(COUNSELORS_REGISTRY).find(
                                c => text.includes(c.name) || text.toUpperCase() === c.name.toUpperCase()
                              );

                              if (mentionedAgent) {
                                return (
                                  <span 
                                    className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-xs font-bold inline-flex items-center gap-1 mx-0.5 group/mention cursor-default"
                                    style={{ color: mentionedAgent.color }}
                                  >
                                    <span className="group-hover/mention:scale-110 transition-transform">{mentionedAgent.icon}</span>
                                    {text}
                                    <ArrowRight className="h-2 w-2 opacity-0 -ml-1 group-hover/mention:opacity-100 transition-all" />
                                  </span>
                                );
                              }
                              return <strong className="text-white font-semibold" {...props} />;
                            }
                          }}
                        />

                        {/* Visual Connection (Optional: could be more elaborate) */}
                        {section.mentions && section.mentions.length > 0 && (
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                            <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent" />
                            <span className="uppercase tracking-tighter opacity-50">Cross-Reference Flow</span>
                            <div className="h-px flex-1 bg-gradient-to-l from-white/5 to-transparent" />
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (section.type === 'verdict') {
                    return (
                      <div key={idx} className="mt-6 relative overflow-hidden p-0.5 rounded-xl bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 animate-gradient-x shadow-lg shadow-emerald-500/10">
                        <div className="bg-zinc-900/95 backdrop-blur-sm p-4 rounded-[10px] h-full w-full">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                              <Gavel className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 uppercase tracking-wider text-sm">
                              Veredito do Conselho
                            </span>
                          </div>
                          <MarkdownRenderer 
                            content={section.content.replace('[VEREDITO_DO_CONSELHO]', '').trim()} 
                            className="prose-p:text-zinc-100 prose-p:font-medium" 
                          />
                        </div>
                      </div>
                    );
                  }

                  return <MarkdownRenderer key={idx} content={section.content} />;
                })
              ) : (
                <MarkdownRenderer content={message.content} />
              )}

              {nanobananaPrompts.length > 0 && (
                <div className="space-y-4 mt-4 border-t border-purple-500/10 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Ações de Design Disponíveis</span>
                  </div>
                  <div className="space-y-3">
                    {nanobananaPrompts.map((prompt, idx) => (
                      <DesignGenerationCard 
                        key={`${message.id}-design-${idx}`}
                        promptData={prompt} 
                        conversationId={message.id} 
                        campaignId={campaignId}
                      />
                    ))}
                  </div>
                </div>
              )}

              {councilOutput && (
                <AssetPreview data={councilOutput} />
              )}
            </div>
          )}
        </div>

        {/* Counselor Badges */}
        {!isUser && (message.metadata?.counselors || message.metadata?.sources) && (
          <div className="mt-2">
            <CounselorBadges 
              counselors={message.metadata.counselors}
              sources={message.metadata.sources}
              compact
            />
          </div>
        )}

        {/* Sources */}
        {!isUser && message.metadata?.sources && message.metadata.sources.length > 0 && (
          <div className="mt-2">
            <SourcesList sources={message.metadata.sources} />
          </div>
        )}

        {/* Copy button */}
        {!isUser && (
          <div className="mt-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 h-8 px-2 -ml-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

