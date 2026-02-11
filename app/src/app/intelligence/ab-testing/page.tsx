'use client';

import { useEffect, useState } from 'react';
import { FlaskConical, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ABTestWizard } from '@/components/intelligence/ab-test-wizard';
import { ABTestCard } from '@/components/intelligence/ab-test-card';
import { ABTestResults } from '@/components/intelligence/ab-test-results';
import { useBrandStore } from '@/lib/stores/brand-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import type { ABTest } from '@/types/ab-testing';

export default function ABTestingPage() {
  const { selectedBrand } = useBrandStore();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [logRefreshKey, setLogRefreshKey] = useState(0);

  const selectedTest = tests.find((t) => t.id === selectedTestId) || null;

  const loadTests = async () => {
    if (!selectedBrand?.id) return;
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/intelligence/ab-tests?brandId=${selectedBrand.id}`, { headers });
      const payload = await response.json();
      const data = payload?.data ?? payload;
      setTests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar testes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, [selectedBrand?.id]);

  const handleAction = async (action: 'start' | 'pause' | 'complete') => {
    if (!selectedBrand?.id || !selectedTest) return;
    setUpdating(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/intelligence/ab-tests/${selectedTest.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          brandId: selectedBrand.id,
          action,
        }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? 'Erro ao atualizar teste');
      }
      await loadTests();
    } catch (error) {
      console.error('Erro ao atualizar teste:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAutoOptimize = async (nextValue: boolean) => {
    if (!selectedBrand?.id || !selectedTest) return;
    setUpdating(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/intelligence/ab-tests/${selectedTest.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          brandId: selectedBrand.id,
          autoOptimize: nextValue,
        }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? 'Erro ao atualizar auto-optimize');
      }
      await loadTests();
    } catch (error) {
      console.error('Erro ao atualizar auto-optimize:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleRunOptimization = async () => {
    if (!selectedBrand?.id || !selectedTest) return;
    setUpdating(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/intelligence/ab-tests/${selectedTest.id}/optimize`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId: selectedBrand.id }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? 'Erro ao executar optimization');
      }
      setLogRefreshKey((prev) => prev + 1);
      await loadTests();
    } catch (error) {
      console.error('Erro ao executar optimization:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 gap-1 px-2">
              <FlaskConical className="w-3 h-3" />
              Intelligence Wing
            </Badge>
            <span className="text-zinc-500 text-sm">/ A/B Testing</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            A/B Testing
            <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
          </h1>
          <p className="text-zinc-400 max-w-2xl">
            Crie variantes por segmento, mensure performance e descubra quais mensagens convertem melhor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadTests} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>
          <Button onClick={() => setShowWizard((prev) => !prev)}>
            {showWizard ? 'Fechar Wizard' : 'New A/B Test'}
          </Button>
        </div>
      </div>

      {showWizard && (
        <ABTestWizard brandId={selectedBrand?.id || ''} onCreated={loadTests} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4 border-zinc-800 bg-zinc-900/40">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Testes</h2>
              <span className="text-xs text-zinc-500">{tests.length} total</span>
            </div>
          </Card>

          <div className="space-y-3">
            {tests.map((test) => (
              <ABTestCard
                key={test.id}
                test={test}
                onSelect={setSelectedTestId}
                isActive={test.id === selectedTestId}
              />
            ))}
            {tests.length === 0 && !loading && (
              <Card className="p-6 border-dashed border-zinc-800 bg-transparent text-center text-sm text-zinc-500">
                Nenhum teste criado ainda.
              </Card>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedTest ? (
            <ABTestResults
              test={selectedTest}
              onAction={handleAction}
              onToggleAutoOptimize={handleToggleAutoOptimize}
              onRunOptimization={handleRunOptimization}
              isUpdating={updating}
              logRefreshKey={logRefreshKey}
            />
          ) : (
            <Card className="p-8 border-zinc-800 bg-zinc-900/30 text-center text-zinc-500">
              Selecione um teste para ver resultados.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
