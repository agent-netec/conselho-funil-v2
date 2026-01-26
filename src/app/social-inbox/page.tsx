'use client';

import { useState, useEffect } from 'react';
import { SocialInteraction, BrandVoiceSuggestion } from '@/types/social-inbox';
import { InteractionCard } from '@/components/social-inbox/interaction-card';
import { ResponseEditor } from '@/components/social-inbox/response-editor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, RefreshCw, LayoutDashboard } from 'lucide-react';
import { toast } from '@/components/ui/toast-notifications';

export default function SocialInboxPage() {
  const [interactions, setInteractions] = useState<SocialInteraction[]>([]);
  const [selectedInteraction, setSelectedInteraction] = useState<SocialInteraction | null>(null);
  const [suggestions, setSuggestions] = useState<BrandVoiceSuggestion | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('marketing digital'); // Mock default

  const fetchInteractions = async () => {
    setIsLoading(true);
    try {
      // Usando a API Route que criamos anteriormente
      const brandId = 'mock-brand-123'; // Em produção viria do context/store
      const response = await fetch(`/api/social-inbox?brandId=${brandId}&keyword=${searchQuery}`);
      const data = await response.json();
      
      if (data.sampleInteraction) {
        // Mocking a list based on the sample
        setInteractions([data.sampleInteraction]);
      } else {
        setInteractions([]);
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar inbox",
        description: "Não foi possível conectar ao agregador social.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestions = async (interaction: SocialInteraction) => {
    setIsLoadingSuggestions(true);
    try {
      const brandId = 'mock-brand-123';
      const response = await fetch(`/api/social-inbox?brandId=${brandId}&keyword=${searchQuery}`);
      const data = await response.json();
      if (data.sampleSuggestions) {
        setSuggestions(data.sampleSuggestions);
      }
    } catch (error) {
      console.error("Erro ao carregar sugestões:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, []);

  const handleSelectInteraction = (interaction: SocialInteraction) => {
    setSelectedInteraction(interaction);
    setSuggestions(undefined);
    fetchSuggestions(interaction);
  };

    try {
      // 1. Validar Safety Gate se for negativo
      if (interaction.metadata.sentimentLabel === 'negative') {
        toast({
          title: "Bloqueio de Segurança",
          description: "Interações negativas exigem revisão manual e não podem ser automatizadas.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Resposta enviada!",
        description: "A mensagem foi publicada com sucesso na rede social.",
      });
      // Aqui integraria com o endpoint /respond do contrato
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Falha na comunicação com a rede social.",
        variant: "destructive"
      });
    }
  };

  const handleQuickAction = (action: 'like' | 'follow') => {
    toast({
      title: "Ação realizada",
      description: `Você deu ${action === 'like' ? 'Like' : 'Follow'} nesta interação.`,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Social Command Center</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por keyword..." 
              className="pl-9 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInteractions()}
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchInteractions}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Sincronizar
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Master List */}
        <aside className="w-80 border-r bg-muted/10 flex flex-col">
          <Tabs defaultValue="all" className="w-full">
            <div className="px-4 pt-4">
              <TabsList className="grid grid-cols-3 w-full h-8">
                <TabsTrigger value="all" className="text-[10px]">TUDO</TabsTrigger>
                <TabsTrigger value="pending" className="text-[10px]">PENDENTES</TabsTrigger>
                <TabsTrigger value="mentions" className="text-[10px]">MENÇÕES</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="m-0">
              <ScrollArea className="h-[calc(100vh-12rem)] p-4">
                {interactions.length > 0 ? (
                  interactions.map((item) => (
                    <InteractionCard 
                      key={item.id} 
                      interaction={item}
                      isActive={selectedInteraction?.id === item.id}
                      onClick={handleSelectInteraction}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    Nenhuma interação encontrada.
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Main Content: Detail & Editor */}
        <main className="flex-1 bg-background p-6 overflow-y-auto">
          {selectedInteraction ? (
            <div className="max-w-4xl mx-auto h-full">
              <ResponseEditor 
                interaction={selectedInteraction}
                suggestions={suggestions}
                onSend={handleSendResponse}
                onQuickAction={handleQuickAction}
                isLoadingSuggestions={isLoadingSuggestions}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">Selecione uma interação na lista ao lado para começar.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Helper para lucide
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
