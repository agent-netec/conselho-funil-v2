'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Tag, Shield, Target, Briefcase, Trash2, Save, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  getBrandKeywordsConfig, 
  saveBrandKeywordsConfig 
} from '@/lib/firebase/intelligence';
import { getBrand } from '@/lib/firebase/brands';
import { BrandKeyword, KeywordType, KeywordPriority, BrandKeywordsConfig } from '@/types/intelligence';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface KeywordManagementProps {
  brandId: string;
}

const KEYWORD_TYPES: { value: KeywordType; label: string; icon: any }[] = [
  { value: 'brand', label: 'Marca', icon: Shield },
  { value: 'competitor', label: 'Concorrente', icon: Target },
  { value: 'industry', label: 'Mercado/Indústria', icon: Briefcase },
  { value: 'product', label: 'Produto', icon: Tag },
];

const PRIORITIES: { value: KeywordPriority; label: string; color: string }[] = [
  { value: 'high', label: 'Alta', color: 'bg-red-500' },
  { value: 'medium', label: 'Média', color: 'bg-yellow-500' },
  { value: 'low', label: 'Baixa', color: 'bg-blue-500' },
];

export function KeywordManagement({ brandId }: KeywordManagementProps) {
  const [config, setConfig] = useState<BrandKeywordsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<KeywordType>('brand');
  const [selectedPriority, setSelectedPriority] = useState<KeywordPriority>('medium');

  useEffect(() => {
    loadConfig();
  }, [brandId]);

  async function loadConfig() {
    try {
      setLoading(true);
      const data = await getBrandKeywordsConfig(brandId);
      if (data) {
        setConfig(data);
      } else {
        // Inicializar config padrão se não existir
        const defaultConfig: BrandKeywordsConfig = {
          brandId,
          keywords: [],
          excludeTerms: [],
          settings: {
            pollingIntervalMinutes: 15,
            maxResultsPerSource: 50,
            enabledSources: ['google_news', 'rss_feed'],
          },
          updatedAt: Timestamp.now(),
          updatedBy: 'system',
          version: 1,
        };
        setConfig(defaultConfig);
      }
    } catch (error) {
      toast.error('Erro ao carregar configurações de keywords');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddKeyword() {
    if (!newKeyword.trim()) return;
    if (config && config.keywords.length >= 20) {
      toast.error('Limite de 20 keywords atingido');
      return;
    }

    const keyword: BrandKeyword = {
      term: newKeyword.trim(),
      type: selectedType,
      priority: selectedPriority,
      active: true,
    };

    const updatedConfig = {
      ...config!,
      keywords: [...(config?.keywords || []), keyword],
    };

    setConfig(updatedConfig);
    setNewKeyword('');
    toast.success('Keyword adicionada (não esqueça de salvar)');
  }

  function handleRemoveKeyword(index: number) {
    if (!config) return;
    const updatedKeywords = [...config.keywords];
    updatedKeywords.splice(index, 1);
    setConfig({ ...config, keywords: updatedKeywords });
  }

  async function handleSave() {
    if (!config) return;
    try {
      setSaving(true);
      await saveBrandKeywordsConfig(brandId, config);
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  }

  async function importFromBrandKit() {
    try {
      const brand = await getBrand(brandId);
      if (!brand) return;

      // Lógica para extrair termos do posicionamento/audiência da marca
      const terms = [
        brand.name,
        brand.vertical,
        ...brand.audience.objections.slice(0, 3)
      ].filter(Boolean);

      const newKeywords: BrandKeyword[] = terms.map(term => ({
        term,
        type: 'brand',
        priority: 'high',
        active: true,
      }));

      setConfig(prev => ({
        ...prev!,
        keywords: [...(prev?.keywords || []), ...newKeywords].slice(0, 20),
      }));
      
      toast.success('Keywords importadas do BrandKit');
    } catch (error) {
      toast.error('Erro ao importar do BrandKit');
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando configurações...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monitoramento de Keywords</CardTitle>
              <CardDescription>
                Gerencie os termos que o Scout Agent deve monitorar para sua marca.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={importFromBrandKit}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Importar BrandKit
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Adicionar Nova Keyword */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="md:col-span-2 space-y-2">
              <Label>Termo de Busca</Label>
              <Input 
                placeholder="Ex: Nome da sua marca ou concorrente" 
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select 
                className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-background"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as KeywordType)}
              >
                {KEYWORD_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={handleAddKeyword}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Lista de Keywords */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              Keywords Ativas ({config?.keywords.length || 0}/20)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {config?.keywords.map((kw, index) => {
                const typeInfo = KEYWORD_TYPES.find(t => t.value === kw.type);
                const TypeIcon = typeInfo?.icon || Tag;
                const priorityInfo = PRIORITIES.find(p => p.value === kw.priority);

                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 border rounded-lg bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 border rounded-md bg-muted">
                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none mb-1">{kw.term}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                            {typeInfo?.label}
                          </Badge>
                          <div className={`w-1.5 h-1.5 rounded-full ${priorityInfo?.color}`} title={`Prioridade ${priorityInfo?.label}`} />
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveKeyword(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
              {(!config?.keywords || config.keywords.length === 0) && (
                <div className="col-span-full py-8 text-center border border-dashed rounded-lg text-muted-foreground">
                  Nenhuma keyword configurada. Adicione termos acima para começar o monitoramento.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
