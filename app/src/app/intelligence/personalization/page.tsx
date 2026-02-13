"use client"

import * as React from "react"
import { AudienceScanCard, AudienceScanSkeleton } from "@/components/intelligence/personalization/AudienceScanCard"
import { PersonaDetailView } from "@/components/intelligence/personalization/PersonaDetailView"
import { PersonalizationRuleEditor } from "@/components/personalization/rule-editor"
import { AudienceScan, DynamicContentRule } from "@/types/personalization"
import {
  getAudienceScans,
  getPersonalizationRules,
  savePersonalizationRule,
  updatePersonalizationRule,
  deletePersonalizationRule,
  togglePersonalizationRule,
} from "@/lib/firebase/personalization"
import { useActiveBrand } from "@/lib/hooks/use-active-brand"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Circle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react"
import { toast } from "sonner"
import { getAuthHeaders } from "@/lib/utils/auth-headers"

// ─── Page ────────────────────────────────────────────────────────────────────
export default function PersonalizationPage() {
  const activeBrand = useActiveBrand()
  const brandId = activeBrand?.id ?? null

  const [scans, setScans] = React.useState<AudienceScan[]>([])
  const [rules, setRules] = React.useState<DynamicContentRule[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedScan, setSelectedScan] = React.useState<AudienceScan | null>(null)
  const [isScanning, setIsScanning] = React.useState(false)
  const [editingRule, setEditingRule] = React.useState<DynamicContentRule | null>(null)
  const [showRuleEditor, setShowRuleEditor] = React.useState(false)

  // ── Fetch scans + rules ──────────────────────────────────────────────────
  const loadData = React.useCallback(async () => {
    if (!brandId) return
    setLoading(true)
    setError(null)
    try {
      const [scansData, rulesData] = await Promise.all([
        getAudienceScans(brandId),
        getPersonalizationRules(brandId),
      ])
      setScans(scansData)
      setRules(rulesData)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro desconhecido"
      console.error("Erro ao carregar dados de personalização:", message)
      setError("Não foi possível carregar scans. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }, [brandId])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // ── Trigger novo scan ────────────────────────────────────────────────────
  const handleRunScan = async () => {
    if (!brandId) return
    setIsScanning(true)
    toast.info("Iniciando Deep-Scan de audiência com IA...")

    try {
      const headers = await getAuthHeaders()
      const response = await fetch("/api/intelligence/audience/scan", {
        method: "POST",
        headers,
        body: JSON.stringify({ brandId }),
      })

      if (!response.ok) {
        throw new Error(`Falha na API (${response.status})`)
      }

      const newScan: AudienceScan = await response.json()
      setScans((prev) => [newScan, ...prev].slice(0, 10))
      setSelectedScan(newScan)
      toast.success("Novo scan de audiência concluído!")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"
      toast.error(`Erro ao executar scan: ${message}`)
    } finally {
      setIsScanning(false)
    }
  }

  // ── Save / Update rule ──────────────────────────────────────────────────
  const handleSaveRule = async (ruleData: Partial<DynamicContentRule>) => {
    if (!brandId) return
    try {
      if (ruleData.id) {
        // Atualização de regra existente
        const { id, ...updateData } = ruleData
        await updatePersonalizationRule(brandId, id, updateData)
        toast.success("Regra atualizada com sucesso!")
      } else {
        // Criação de nova regra
        await savePersonalizationRule(
          brandId,
          ruleData as Omit<DynamicContentRule, "id" | "updatedAt">
        )
        toast.success("Regra de personalização salva com sucesso!")
      }
      setEditingRule(null)
      setShowRuleEditor(false)
      loadData()
    } catch {
      toast.error("Erro ao salvar regra.")
    }
  }

  // ── Delete rule ────────────────────────────────────────────────────────
  const handleDeleteRule = async (ruleId: string) => {
    if (!brandId) return
    try {
      await deletePersonalizationRule(brandId, ruleId)
      toast.success("Regra excluída com sucesso!")
      setEditingRule(null)
      setShowRuleEditor(false)
      loadData()
    } catch {
      toast.error("Erro ao excluir regra.")
    }
  }

  // ── Toggle rule ────────────────────────────────────────────────────────
  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    if (!brandId) return
    try {
      await togglePersonalizationRule(brandId, ruleId, isActive)
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, isActive } : r))
      )
      toast.success(isActive ? "Regra ativada!" : "Regra desativada.")
    } catch {
      toast.error("Erro ao alterar estado da regra.")
    }
  }

  // ── Cancel editing ─────────────────────────────────────────────────────
  const handleCancelEditor = () => {
    setEditingRule(null)
    setShowRuleEditor(false)
  }

  // ── Rules filtradas pelo scan selecionado ──────────────────────────────
  const filteredRules = React.useMemo(
    () =>
      selectedScan
        ? rules.filter((r) => r.targetPersonaId === selectedScan.id)
        : [],
    [rules, selectedScan]
  )

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-500" />
            Personalização Dinâmica
          </h1>
          <p className="text-muted-foreground">
            Gerencie como sua audiência interage com seu conteúdo baseado em
            inteligência psicográfica.
          </p>
        </div>
        <Button
          onClick={handleRunScan}
          disabled={isScanning || !brandId}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
        >
          {isScanning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          {isScanning ? "Escaneando..." : "Executar Deep-Scan (IA)"}
        </Button>
      </div>

      {/* ── ERROR STATE ─────────────────────────────────────────────────── */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertTriangle className="w-8 h-8 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Verifique sua conexão e tente novamente.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="gap-2 shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── MAIN GRID ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Coluna de Scans (lista) ─────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-blue-500" />
            Scans de Audiência
          </h2>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* LOADING STATE */}
            {loading && !error
              ? [1, 2, 3].map((i) => <AudienceScanSkeleton key={i} />)
              : null}

            {/* SCAN LIST */}
            {!loading && !error && scans.length > 0
              ? scans.map((scan) => (
                  <AudienceScanCard
                    key={scan.id}
                    scan={scan}
                    isSelected={selectedScan?.id === scan.id}
                    onSelect={setSelectedScan}
                  />
                ))
              : null}

            {/* EMPTY STATE */}
            {!loading && !error && scans.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/5 space-y-4">
                <Search className="w-12 h-12 mx-auto text-muted-foreground/30" />
                <div>
                  <h3 className="font-medium text-lg">
                    Nenhum scan realizado
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[260px] mx-auto">
                    Execute seu primeiro scan de audiência para descobrir
                    personas, dores e propensão de compra.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleRunScan}
                  disabled={isScanning || !brandId}
                  className="gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  {isScanning ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  Executar primeiro scan
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Coluna de Detalhe ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {selectedScan ? (
            <>
              <PersonaDetailView scan={selectedScan} />

              {/* ── Rules List ──────────────────────────────────────── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Regras de Conteúdo Dinâmico
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setEditingRule(null)
                      setShowRuleEditor(true)
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Nova Regra
                  </Button>
                </div>

                {filteredRules.length > 0 ? (
                  <div className="space-y-2">
                    {filteredRules.map((rule) => (
                      <Card
                        key={rule.id}
                        className={`transition-colors ${
                          rule.isActive
                            ? "border-green-200 bg-green-50/30"
                            : "border-gray-200 bg-gray-50/30"
                        }`}
                      >
                        <CardContent className="flex items-center gap-4 py-3 px-4">
                          {/* Toggle ativar/desativar */}
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleRule(rule.id, !rule.isActive)
                            }
                            className="shrink-0 focus:outline-none"
                            title={
                              rule.isActive
                                ? "Desativar regra"
                                : "Ativar regra"
                            }
                          >
                            {rule.isActive ? (
                              <CheckCircle2 className="w-6 h-6 text-green-500" />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-400" />
                            )}
                          </button>

                          {/* Conteúdo da rule */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                rule.isActive
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {rule.contentVariations.headline || "(Sem headline)"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {rule.isActive ? "Ativa" : "Inativa"}
                              {rule.contentVariations.vslId &&
                                ` · VSL: ${rule.contentVariations.vslId}`}
                              {rule.contentVariations.offerId &&
                                ` · Oferta: ${rule.contentVariations.offerId}`}
                            </p>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Editar regra"
                              onClick={() => {
                                setEditingRule(rule)
                                setShowRuleEditor(true)
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              title="Excluir regra"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Tem certeza que deseja excluir esta regra?"
                                  )
                                ) {
                                  handleDeleteRule(rule.id)
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* ── Empty rules state ────────────────────────────── */
                  !showRuleEditor && (
                    <div className="text-center py-10 border-2 border-dashed rounded-xl bg-muted/5 space-y-3">
                      <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/30" />
                      <div>
                        <p className="font-medium">Nenhuma regra configurada</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Crie sua primeira regra de conteúdo dinâmico para esta persona.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="gap-2 bg-purple-600 hover:bg-purple-700"
                        onClick={() => {
                          setEditingRule(null)
                          setShowRuleEditor(true)
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Criar primeira regra
                      </Button>
                    </div>
                  )
                )}
              </div>

              {/* ── Rule Editor (create / edit) ────────────────────── */}
              {showRuleEditor && (
                <PersonalizationRuleEditor
                  scan={selectedScan}
                  existingRule={editingRule ?? undefined}
                  onSave={handleSaveRule}
                  onCancel={handleCancelEditor}
                  onDelete={handleDeleteRule}
                />
              )}
            </>
          ) : (
            /* ── No scan selected placeholder ─────────────────────── */
            <div className="h-full flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-muted/10">
              <Sparkles className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-medium">Selecione um Scan</h3>
              <p className="text-sm text-muted-foreground max-w-[300px] text-center mt-1">
                Escolha um scan ao lado para visualizar a persona completa e
                configurar regras de conteúdo dinâmico.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
