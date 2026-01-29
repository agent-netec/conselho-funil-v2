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
  CheckCircle2,
  UserCheck,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponseEditorProps {
  interaction: SocialInteraction;
  suggestions?: BrandVoiceSuggestion;
  onSend: (text: string) => void;
  onQuickAction: (action: 'like' | 'follow') => void;
  onEscalate: () => void;
  isLoadingSuggestions?: boolean;
}

export function ResponseEditor({ 
  interaction, 
  suggestions, 
  onSend, 
  onQuickAction,
  onEscalate,
  isLoadingSuggestions 
}: ResponseEditorProps) {
  const [responseText, setResponseText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleApplySuggestion = (text: string) => {
    setResponseText(text);
    setIsEditing(true);
  };

  const isLowSentiment = interaction.metadata.sentimentScore < 0.3;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Interaction Context */}
      <Card className={cn(
        "p-4 border-dashed relative transition-colors",
        isLowSentiment ? "bg-red-50/50 border-red-200" : "bg-muted/30"
      )}>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={isLowSentiment ? "destructive" : "outline"} className="text-[10px]">
            {isLowSentiment ? "CRITICAL: BAIXO SENTIMENTO" : "CONVERSA ORIGINAL"}
          </Badge>
          <span className="text-[10px] text-muted-foreground">ID: {interaction.externalId}</span>
        </div>
        <p className={cn(
          "text-sm italic",
          isLowSentiment ? "text-red-900 font-medium" : "text-muted-foreground"
        )}>"{interaction.content.text}"</p>
        
        <div className="absolute top-4 right-4 flex gap-2">
          <Button 
            variant={isLowSentiment ? "destructive" : "ghost"} 
            size="sm" 
            className={cn(
              "h-8 text-[10px] gap-1",
              !isLowSentiment && "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            )}
            onClick={onEscalate}
          >
            <UserCheck className="h-3 w-3" /> {isLowSentiment ? "Escalar Imediatamente" : "Escalar para Especialista"}
          </Button>
        </div>
      </Card>

      {/* AI Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Sugestões "Brand-Aware"</h3>
          </div>
          {isLoadingSuggestions && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestions?.options.slice(0, 3).map((option, idx) => (
            <Card 
              key={idx}
              className="p-3 cursor-pointer hover:border-primary/50 transition-colors border-primary/10 bg-primary/5 flex flex-col justify-between"
              onClick={() => handleApplySuggestion(option.text)}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[9px] uppercase">{option.tone}</Badge>
                    {option.confidence >= 0.9 && (
                      <CheckCircle2 className="h-3 w-3 text-green-500" title="Alta Fidelidade de Voz" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[9px] font-medium",
                    option.confidence >= 0.9 ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {Math.round(option.confidence * 100)}% match
                  </span>
                </div>
                <p className="text-[11px] line-clamp-3 leading-relaxed mb-2">{option.text}</p>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="h-6 text-[9px] p-0 px-2 gap-1">
                  <Edit3 className="h-2.5 w-2.5" /> Usar e Editar
                </Button>
              </div>
            </Card>
          ))}
          {!suggestions && !isLoadingSuggestions && (
            <div className="col-span-3 py-8 text-center border-2 border-dashed rounded-lg text-muted-foreground text-xs">
              Gerando sugestões baseadas no BrandVoice...
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col gap-3 min-h-[200px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Resposta Final</h3>
            {isEditing && <Badge variant="outline" className="text-[9px] text-primary border-primary/20 bg-primary/5">EDIÇÃO RÁPIDA ATIVA</Badge>}
          </div>
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
          className="flex-1 resize-none text-sm p-4 focus-visible:ring-primary"
          value={responseText}
          onChange={(e) => {
            setResponseText(e.target.value);
            if (!isEditing) setIsEditing(true);
          }}
        />

        {isLowSentiment && (
          <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-[11px] text-red-600">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Risco de Sentimento: Esta interação possui score baixo ({Math.round(interaction.metadata.sentimentScore * 100)}%). Considere escalar para um especialista.</span>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => {
            setResponseText('');
            setIsEditing(false);
          }}>Limpar</Button>
          <Button 
            className="gap-2 px-8" 
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
