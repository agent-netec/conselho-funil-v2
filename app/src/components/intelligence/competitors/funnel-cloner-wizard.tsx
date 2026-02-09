'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe, CheckCircle2, AlertCircle, ArrowRight, Copy } from 'lucide-react';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

interface FunnelClonerWizardProps {
  brandId: string;
  funnelId: string;
  onComplete?: (templateId: string) => void;
}

type Step = 'input' | 'cloning' | 'analyzing' | 'success' | 'error';

export const FunnelClonerWizard: React.FC<FunnelClonerWizardProps> = ({
  brandId,
  funnelId,
  onComplete
}) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);

  const startCloning = async () => {
    if (!url) return;
    
    setStep('cloning');
    setProgress(10);
    setError(null);

    try {
      // Simulação de progresso para UX
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 5;
        });
      }, 1000);

      // Chamada real para a API/Action que orquestra o FunnelCloner
      // Aqui usamos fetch para um endpoint que criaremos ou chamamos o agente via server action
      const headers = await getAuthHeaders();
      const response = await fetch('/api/intelligence/funnel/clone', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId, funnelId, url, name })
      });

      clearInterval(interval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Falha ao clonar funil');
      }

      const { docId } = await response.json();
      
      setProgress(100);
      setTemplateId(docId);
      setStep('success');
      
      if (onComplete) onComplete(docId);
    } catch (err: any) {
      setError(err.message);
      setStep('error');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-dashed border-2">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            BETA
          </Badge>
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Spy Agent Module
          </span>
        </div>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" />
          Funnel Cloner MVP
        </CardTitle>
        <CardDescription>
          Cole a URL de um funil de concorrente para extrair sua arquitetura, headlines e CTAs.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 py-4">
        {step === 'input' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-2">
              <label className="text-sm font-medium">URL do Funil</label>
              <Input 
                placeholder="https://exemplo.com/vsl" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Template (Opcional)</label>
              <Input 
                placeholder="Ex: Funil de VSL do Concorrente X" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-primary/80 leading-relaxed">
                O **Spy Agent** irá navegar pelas páginas, extrair o conteúdo via Firecrawl e usar o **Gemini 2.0 Flash** para reconstruir a arquitetura do funil no seu namespace privado.
              </p>
            </div>
          </div>
        )}

        {(step === 'cloning' || step === 'analyzing') && (
          <div className="py-8 space-y-6 text-center animate-in fade-in zoom-in duration-500">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Globe className="w-10 h-10 text-primary animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {progress < 50 ? 'Navegando e Capturando...' : 'Analisando Estrutura com AI...'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Isso pode levar até 60 segundos dependendo do tamanho do funil.
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                <span>Scraping</span>
                <span>Análise AI</span>
                <span>Finalizando</span>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-4 space-y-6 text-center animate-in fade-in scale-in duration-500">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Funil Clonado com Sucesso!</h3>
              <p className="text-sm text-muted-foreground">
                O template foi salvo e já está disponível para os **Conselheiros** usarem como contexto.
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-xl border flex items-center justify-between group">
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">ID do Template</p>
                <code className="text-xs font-mono">{templateId}</code>
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="py-4 space-y-4 text-center animate-in shake duration-500">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-destructive">Erro na Clonagem</h3>
              <p className="text-sm text-muted-foreground">
                {error || 'Não foi possível processar esta URL. Verifique se o site permite acesso.'}
              </p>
            </div>
            <Button variant="outline" onClick={() => setStep('input')}>
              Tentar Novamente
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-muted/30 border-t py-4">
        {step === 'input' && (
          <Button className="w-full gap-2" onClick={startCloning} disabled={!url}>
            Iniciar Clonagem Inteligente
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
        {step === 'success' && (
          <Button className="w-full" variant="default" onClick={() => window.location.reload()}>
            Clonar Outro Funil
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
