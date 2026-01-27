"use client"

import * as React from "react"
import { AudienceScanCard, AudienceScanSkeleton } from "@/components/personalization/audience-scan-card"
import { PersonalizationRuleEditor } from "@/components/personalization/rule-editor"
import { AudienceScan, DynamicContentRule } from "@/types/personalization"
import { getAudienceScans, getPersonalizationRules, savePersonalizationRule } from "@/lib/firebase/personalization"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BrainCircuit, RefreshCw, Sparkles, Wand2 } from "lucide-react"
import { toast } from "sonner"

export default function PersonalizationPage() {
  const [scans, setScans] = React.useState<AudienceScan[]>([]);
  const [rules, setRules] = React.useState<DynamicContentRule[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedScan, setSelectedScan] = React.useState<AudienceScan | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);

  const brandId = "brand_default"; // Em um app real, viria do contexto de auth/tenant

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [scansData, rulesData] = await Promise.all([
        getAudienceScans(brandId),
        getPersonalizationRules(brandId)
      ]);
      setScans(scansData);
      setRules(rulesData);
    } catch (error) {
      console.error("Erro ao carregar dados de personalização:", error);
      toast.error("Falha ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunScan = async () => {
    setIsScanning(true);
    toast.info("Iniciando Deep-Scan de audiência com IA...");
    
    try {
      // Aqui chamaríamos o motor do Darllyson (ST-29.1) via API
      const response = await fetch('/api/intelligence/audience/scan', {
        method: 'POST',
        body: JSON.stringify({ brandId })
      });
      
      if (!response.ok) throw new Error("Falha na API");
      
      const newScan = await response.json();
      setScans(prev => [newScan, ...prev]);
      setSelectedScan(newScan);
      toast.success("Novo scan de audiência concluído!");
    } catch (error) {
      toast.error("Erro ao executar scan.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveRule = async (ruleData: Partial<DynamicContentRule>) => {
    try {
      await savePersonalizationRule(brandId, ruleData as any);
      toast.success("Regra de personalização salva com sucesso!");
      loadData();
    } catch (error) {
      toast.error("Erro ao salvar regra.");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-500" />
            Personalização Dinâmica
          </h1>
          <p className="text-muted-foreground">
            Gerencie como sua audiência interage com seu conteúdo baseado em inteligência psicográfica.
          </p>
        </div>
        <Button 
          onClick={handleRunScan} 
          disabled={isScanning}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
        >
          {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Executar Deep-Scan (IA)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna de Scans */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-blue-500" />
            Scans de Audiência
          </h2>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {loading ? (
              [1, 2, 3].map(i => <AudienceScanSkeleton key={i} />)
            ) : scans.length > 0 ? (
              scans.map(scan => (
                <AudienceScanCard 
                  key={scan.id} 
                  scan={scan} 
                  isSelected={selectedScan?.id === scan.id}
                  onSelect={setSelectedScan}
                />
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-xl">
                <p className="text-sm text-muted-foreground">Nenhum scan realizado ainda.</p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna de Editor/Regras */}
        <div className="lg:col-span-2 space-y-6">
          {selectedScan ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm uppercase text-muted-foreground">Persona Detalhada</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-sm font-bold">Dores:</span>
                      <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                        {selectedScan.persona.painPoints.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="text-sm font-bold">Desejos:</span>
                      <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                        {selectedScan.persona.desires.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm uppercase text-muted-foreground">Raciocínio da IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedScan.propensity.reasoning}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <PersonalizationRuleEditor 
                scan={selectedScan} 
                existingRule={rules.find(r => r.targetPersonaId === selectedScan.id)}
                onSave={handleSaveRule}
              />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-muted/10">
              <Sparkles className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-medium">Selecione um Scan</h3>
              <p className="text-sm text-muted-foreground">Escolha um scan ao lado para configurar as regras de conteúdo dinâmico.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
