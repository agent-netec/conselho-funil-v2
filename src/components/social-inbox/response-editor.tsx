'use client';

import { useState } from 'react';
import { SocialInteraction, BrandVoiceSuggestion } from '@/types/social-inbox';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Send, 
  ThumbsUp, 
  UserPlus, 
  RefreshCw,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponseEditorProps {
  interaction: SocialInteraction;
  suggestions?: BrandVoiceSuggestion;
  onSend: (text: string) => void;
  onQuickAction: (action: 'like' | 'follow') => void;
  isLoadingSuggestions?: boolean;
}

export function ResponseEditor({ 
  interaction, 
  suggestions, 
  onSend, 
  onQuickAction,
  isLoadingSuggestions 
}: ResponseEditorProps) {
  const [responseText, setResponseText] = useState('');

  const handleApplySuggestion = (text: string) => {
    setResponseText(text);
  };

  const isNegative = interaction.metadata.sentimentLabel === 'negative';

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Interaction Context */}
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-[10px]">CONVERSA ORIGINAL</Badge>
          <span className="text-[10px] text-muted-foreground">ID: {interaction.externalId}</span>
        </div>
        <p className="text-sm italic text-muted-foreground">"{interaction.content.text}"</p>
      </Card>

      {/* AI Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Sugestões de Voz da Marca</h3>
          </div>
          {isLoadingSuggestions && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestions?.options.map((option, idx) => (
            <Card 
              key={idx}
              className="p-3 cursor-pointer hover:border-primary/50 transition-colors border-primary/10 bg-primary/5"
              onClick={() => handleApplySuggestion(option.text)}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="text-[9px] uppercase">{option.tone}</Badge>
                <span className="text-[9px] text-muted-foreground">{Math.round(option.confidence * 100)}% match</span>
              </div>
              <p className="text-[11px] line-clamp-3 leading-relaxed">{option.text}</p>
            </Card>
          ))}
          {!suggestions && !isLoadingSuggestions && (
            <div className="col-span-3 py-8 text-center border-2 border-dashed rounded-lg text-muted-foreground text-xs">
              Selecione uma interação para gerar sugestões de IA
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col gap-3 min-h-[200px]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Resposta Final</h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-[10px] gap-1"
              onClick={() => onQuickAction('like')}
            >
              <ThumbsUp className="h-3 w-3" /> Like
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-[10px] gap-1"
              onClick={() => onQuickAction('follow')}
            >
              <UserPlus className="h-3 w-3" /> Follow
            </Button>
          </div>
        </div>

        <Textarea 
          placeholder="Escreva sua resposta ou selecione uma sugestão de IA acima..."
          className="flex-1 resize-none text-sm p-4"
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
        />

        {isNegative && (
          <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-[11px] text-yellow-600">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Atenção: Interação negativa. Revise cuidadosamente antes de enviar.</span>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => setResponseText('')}>Limpar</Button>
          <Button 
            className="gap-2" 
            disabled={!responseText}
            onClick={() => onSend(responseText)}
          >
            <Send className="h-4 w-4" /> Enviar Resposta
          </Button>
        </div>
      </div>
    </div>
  );
}
