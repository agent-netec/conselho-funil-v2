'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Paperclip, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn, fileToBase64 } from '@/lib/utils';
import { ChatModeSelector, ChatMode } from './chat-mode-selector';
import { CHAT_MODES, COUNSELORS_REGISTRY } from '@/lib/constants';
import { CounselorId } from '@/types';
import { CounselorSelector } from './party-mode/counselor-selector';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { useUser } from '@/lib/hooks/use-user';
import { uploadBrandAsset, validateBrandAssetFile } from '@/lib/firebase/storage';
import { createAsset } from '@/lib/firebase/assets';
import { analyzeMultimodalWithGemini } from '@/lib/ai/gemini';
import { Timestamp } from 'firebase/firestore';

interface Attachment {
  file: File;
  id: string;
  status: 'uploading' | 'analyzing' | 'ready' | 'error';
  progress: number;
  previewUrl?: string;
  insight?: string;
  error?: string;
}

interface ChatInputAreaProps {
  onSend: (message: string, options?: { selectedAgents?: string[], intensity?: 'debate' | 'consensus' }) => void;
  isLoading: boolean;
  disabled?: boolean;
  disabledMessage?: string;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export function ChatInputArea({ 
  onSend, 
  isLoading,
  disabled = false,
  disabledMessage,
  mode,
  onModeChange,
}: ChatInputAreaProps) {
  const [value, setValue] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<'debate' | 'consensus'>('debate');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [mounted, setMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const activeBrand = useActiveBrand();
  const { user } = useUser();

  // Handle mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const modeConfig = CHAT_MODES[mode];
  const accentColor = modeConfig.accentColor;
  const isPartyMode = mode === 'party';
  const hasMinimumAgents = !isPartyMode || selectedAgents.length >= 3;

  // Handle file uploads and analysis
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || !activeBrand || !user) return;

    const newAttachments: Attachment[] = Array.from(files).map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: 'uploading',
      progress: 0,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setAttachments(prev => [...prev, ...newAttachments]);

    // Process each file
    newAttachments.forEach(async (attachment) => {
      try {
        // 1. Validar
        const validation = validateBrandAssetFile(attachment.file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // 2. Upload para Storage
        const { url, metadata } = await uploadBrandAsset(
          attachment.file, 
          activeBrand.id, 
          user.id,
          (progress) => {
            setAttachments(prev => prev.map(a => 
              a.id === attachment.id ? { ...a, progress } : a
            ));
          }
        );

        // 3. Criar registro no Firestore (US-21.2)
        await createAsset({
          brandId: activeBrand.id,
          userId: user.id,
          name: attachment.file.name,
          originalName: attachment.file.name,
          type: attachment.file.type.startsWith('image/') ? 'image' : 'reference',
          mimeType: attachment.file.type,
          size: attachment.file.size,
          url,
          status: 'ready',
          isApprovedForAI: true, // Auto-aprovado para chat (como solicitado)
          createdAt: Timestamp.now(),
          metadata: {
            sourceType: attachment.file.type.startsWith('image/') ? 'image' : 'pdf',
            originalName: attachment.file.name,
            isApprovedForAI: true,
            extractedAt: new Date().toISOString(),
            processingMethod: 'gemini-vision',
          }
        });

        // 4. Análise Multimodal (Insights Imediatos)
        setAttachments(prev => prev.map(a => 
          a.id === attachment.id ? { ...a, status: 'analyzing' } : a
        ));

        const base64 = await fileToBase64(attachment.file);
        const prompt = attachment.file.type.startsWith('image/') 
          ? "Analise esta imagem sob a perspectiva de um estrategista de funis. Identifique elementos de conversão, copy, design e pontos de melhoria. Seja conciso e direto."
          : "Analise este documento PDF. Extraia os pontos estratégicos mais relevantes para um conselho de marketing. Seja conciso.";
        
        const insight = await analyzeMultimodalWithGemini(prompt, base64, attachment.file.type);

        setAttachments(prev => prev.map(a => 
          a.id === attachment.id ? { ...a, status: 'ready', insight } : a
        ));

      } catch (error) {
        console.error('Erro ao processar anexo:', error);
        setAttachments(prev => prev.map(a => 
          a.id === attachment.id ? { ...a, status: 'error', error: error instanceof Error ? error.message : 'Erro no upload' } : a
        ));
      }
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const filtered = prev.filter(a => a.id !== id);
      // Clean up object URLs
      const removed = prev.find(a => a.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return filtered;
    });
  };

  const isUploading = attachments.some(a => a.status === 'uploading' || a.status === 'analyzing');

  // Reset selected agents when leaving party mode
  useEffect(() => {
    if (!isPartyMode) {
      setSelectedAgents([]);
    } else {
      // Default selection for party mode if empty
      if (selectedAgents.length === 0) {
        setSelectedAgents(['russell_brunson', 'eugene_schwartz', 'dan_kennedy']);
      }
    }
  }, [mode]);

  // Gerar footer dinâmico com base nos conselheiros
  const counselorNames = isPartyMode
    ? selectedAgents.map(id => COUNSELORS_REGISTRY[id as CounselorId]?.name || id).join(', ')
    : modeConfig.counselors
        .map(id => COUNSELORS_REGISTRY[id as CounselorId]?.name || id)
        .join(', ');
  
  const dynamicFooter = mode === 'general' 
    ? modeConfig.footer 
    : isPartyMode
      ? `🎉 Party: ${counselorNames || 'Nenhum selecionado'}`
      : `${modeConfig.footer.split(':')[0]}: ${counselorNames}`;

  const isInputDisabled = isLoading || (mounted && disabled) || isUploading;
  const isSendDisabled = (!value.trim() && attachments.length === 0) || isInputDisabled || !hasMinimumAgents;

  const handleSubmit = () => {
    if ((!value.trim() && attachments.length === 0) || isInputDisabled || !hasMinimumAgents) return;
    
    // Injetar insights dos anexos se houver
    let finalMessage = value.trim();
    const readyAttachments = attachments.filter(a => a.status === 'ready' && a.insight);
    
    if (readyAttachments.length > 0) {
      const insightsContext = readyAttachments.map(a => 
        `--- REFERÊNCIA ANEXADA: ${a.file.name} ---\n${a.insight}`
      ).join('\n\n');
      
      finalMessage = `[CONTEXTO DE ANEXOS]:\n${insightsContext}\n\n---\n\nPERGUNTA DO USUÁRIO: ${finalMessage || '(Análise de referência enviada)'}`;
    }

    if (isPartyMode) {
      onSend(finalMessage, { 
        selectedAgents, 
        intensity 
      });
    } else {
      onSend(finalMessage);
    }
    
    setValue('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  return (
    <div 
      className="border-t border-white/[0.04] bg-[#09090b]/90 backdrop-blur-2xl p-3 sm:p-4 pb-6 sm:pb-4"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="mx-auto max-w-3xl space-y-3">
        {/* Attachment Previews */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-wrap gap-2 pb-1"
            >
              {attachments.map((attachment) => (
                <motion.div
                  key={attachment.id}
                  className="relative group flex items-center gap-2 rounded-xl border border-white/[0.06] bg-zinc-900/80 p-1.5 pr-2"
                >
                  <div className="h-8 w-8 rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                    {attachment.previewUrl ? (
                      <img src={attachment.previewUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <FileText className="h-4 w-4 text-zinc-500" />
                    )}
                  </div>
                  
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="text-[10px] text-zinc-300 truncate max-w-[100px] font-medium">
                      {attachment.file.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {attachment.status === 'uploading' && (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1 w-12 rounded-full bg-zinc-800 overflow-hidden">
                            <motion.div 
                              className="h-full bg-emerald-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${attachment.progress}%` }}
                            />
                          </div>
                          <span className="text-[8px] text-zinc-500">{attachment.progress}%</span>
                        </div>
                      )}
                      {attachment.status === 'analyzing' && (
                        <span className="text-[9px] text-indigo-400 flex items-center gap-1 animate-pulse">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" /> Analisando...
                        </span>
                      )}
                      {attachment.status === 'ready' && (
                        <span className="text-[9px] text-emerald-500 font-medium">Pronto</span>
                      )}
                      {attachment.status === 'error' && (
                        <span className="text-[9px] text-red-500 truncate max-w-[80px]">{attachment.error}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Party Mode Selector */}
        <AnimatePresence>
          {mode === 'party' && (
            <CounselorSelector 
              selectedIds={selectedAgents} 
              onChange={setSelectedAgents}
              intensity={intensity}
              onIntensityChange={setIntensity}
            />
          )}
        </AnimatePresence>

        {/* Mode Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <ChatModeSelector mode={mode} onModeChange={onModeChange} />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onModeChange(isPartyMode ? 'general' : 'party')}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all border',
                isPartyMode
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.35)]'
                  : 'bg-zinc-900/60 border-white/5 text-zinc-200 hover:border-white/10'
              )}
            >
              <Sparkles className="h-4 w-4" />
              {isPartyMode ? 'Alto Conselho Ativo' : 'Invocar Alto Conselho'}
            </motion.button>
          </div>

          {isPartyMode && !hasMinimumAgents && (
            <p className="text-[11px] text-amber-400 font-medium">
              Selecione pelo menos 3 especialistas para iniciar o debate.
            </p>
          )}
        </div>

        {/* Input */}
        <div className={cn(
          "relative flex items-end gap-2 sm:gap-3 rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-2 sm:p-3 transition-all duration-300",
          "focus-within:border-white/[0.1] focus-within:bg-zinc-900/80 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.02)]",
          disabled && "border-red-500/50 bg-red-500/5"
        )}>
          {/* File Input */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            multiple
            accept="image/*,application/pdf"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isInputDisabled}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
              "text-zinc-500 hover:text-white hover:bg-white/[0.05] disabled:opacity-30"
            )}
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mounted && disabled ? (disabledMessage || "Saldo insuficiente") : modeConfig.placeholder}
            disabled={isInputDisabled}
            rows={1}
            className="flex-1 resize-none bg-transparent py-2.5 px-0 text-[16px] sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none disabled:opacity-50 min-h-[44px] sm:min-h-0"
            style={{ maxHeight: '160px' }}
          />
          
          <motion.button
            whileHover={!isInputDisabled ? { scale: 1.05 } : {}}
            whileTap={!isInputDisabled ? { scale: 0.95 } : {}}
            onClick={handleSubmit}
            disabled={isSendDisabled}
            className={cn(
              'flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300',
              (value.trim() || attachments.length > 0) && !isInputDisabled && hasMinimumAgents
                ? accentColor === 'indigo'
                  ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                  : accentColor === 'amber'
                  ? 'bg-amber-500 text-white hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : accentColor === 'blue'
                  ? 'bg-blue-500 text-white hover:bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-zinc-800 text-zinc-500'
            )}
          >
            <Send className="h-5 w-5" />
          </motion.button>
        </div>
        
        <p className="text-center text-[10px] sm:text-xs text-zinc-600 px-4">
          {disabled ? "⚠️ Faça upgrade para obter mais créditos." : dynamicFooter}
        </p>
      </div>
    </div>
  );
}

