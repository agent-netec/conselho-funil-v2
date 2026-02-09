"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, BrainCircuit } from "lucide-react"
import { useAttributionData } from "@/lib/hooks/use-attribution-data"
import { Skeleton } from "@/components/ui/skeleton"

export default function AttributionPage() {
  const [window, setWindow] = React.useState("30")
  const { stats, loading, hasSpendData } = useAttributionData(parseInt(window))

  // Formatar dados para o gráfico
  const chartData = React.useMemo(() => {
    return stats.slice(0, 5).map(s => ({
      name: s.campaignName,
      lastClick: parseFloat(s.conversions.last_touch.toFixed(2)),
      uShape: parseFloat(s.conversions.u_shape.toFixed(2)),
      linear: parseFloat(s.conversions.linear.toFixed(2))
    }))
  }, [stats])

  // Encontrar o maior "Valor Oculto"
  const hiddenValueCampaign = React.useMemo(() => {
    if (stats.length === 0) return null
    return [...stats].sort((a, b) => b.variation - a.variation)[0]
  }, [stats])

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* 1. Header Estratégico */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Model Comparison Dashboard</h1>
          <p className="text-muted-foreground">
            Defesa estratégica de orçamento baseada em atribuição multicanal.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
            <Calendar className="w-4 h-4 ml-2 text-muted-foreground" />
            <Select value={window} onValueChange={setWindow}>
              <SelectTrigger className="w-[110px] border-0 bg-transparent focus:ring-0">
                <SelectValue placeholder="Janela" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Dias</SelectItem>
                <SelectItem value="30">30 Dias</SelectItem>
                <SelectItem value="60">60 Dias</SelectItem>
                <SelectItem value="90">90 Dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-xl" />
          <div className="space-y-6">
            <Skeleton className="h-[200px] rounded-xl" />
            <Skeleton className="h-[200px] rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* 2. Seção: The ROI Shift */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>The ROI Shift</CardTitle>
                  <p className="text-sm text-muted-foreground">Comparativo de Conversões por modelo de atribuição</p>
                </div>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Legend iconType="circle" />
                    <Bar 
                      dataKey="lastClick" 
                      name="Last Click" 
                      fill="#94a3b8" 
                      radius={[4, 4, 0, 0]} 
                      animationDuration={1500}
                    />
                    <Bar 
                      dataKey="uShape" 
                      name="U-Shape" 
                      fill="#8b5cf6" 
                      radius={[4, 4, 0, 0]} 
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {hiddenValueCampaign && (
                <Card className="bg-primary/5 border-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp className="w-24 h-24" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-primary" />
                      Valor Oculto Detectado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed">
                      A campanha <span className="font-bold text-primary">"{hiddenValueCampaign.campaignName}"</span> ganha <span className="text-green-600 font-bold">+{hiddenValueCampaign.variation.toFixed(0)}%</span> de relevância no modelo U-Shape.
                    </p>
                    <div className="p-3 bg-background rounded-lg border text-xs text-muted-foreground">
                      "Embora o Last Click subestime seu impacto, ela é fundamental na jornada de conversão dos seus leads."
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Distribuição de Crédito (U-Shape)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "Topo (First Touch)", value: 40, color: "bg-blue-500" },
                      { label: "Meio (Assisted)", value: 20, color: "bg-purple-500" },
                      { label: "Fundo (Last Click)", value: 40, color: "bg-primary" },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{item.label}</span>
                          <span className="font-bold">{item.value}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full ${item.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Fallback visual — Sprint 27 (P12) */}
          {!hasSpendData && stats.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="py-4 text-sm text-amber-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Sem dados de spend disponíveis. Conecte uma integração de Ads (Meta/Google) para visualizar custos reais por campanha.
              </CardContent>
            </Card>
          )}

          {/* 3. Tabela de Performance Multicanal */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Multicanal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                    <tr>
                      <th className="px-6 py-4 font-medium">Campanha / Fonte</th>
                      <th className="px-6 py-4 font-medium">Conv. (Last Click)</th>
                      <th className="px-6 py-4 font-medium text-primary">Conv. (U-Shape)</th>
                      <th className="px-6 py-4 font-medium text-purple-600">Conv. (Linear)</th>
                      <th className="px-6 py-4 font-medium">Variação (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats.map((row) => (
                      <tr key={row.campaignName} className="bg-background hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 font-medium">{row.campaignName}</td>
                        <td className="px-6 py-4">{row.conversions.last_touch.toFixed(1)}</td>
                        <td className="px-6 py-4 font-bold text-primary">{row.conversions.u_shape.toFixed(1)}</td>
                        <td className="px-6 py-4 text-purple-600">{row.conversions.linear.toFixed(1)}</td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-1 ${row.variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {row.variation >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {row.variation >= 0 ? '+' : ''}{row.variation.toFixed(0)}%
                          </div>
                        </td>
                      </tr>
                    ))}
                    {stats.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                          Nenhum dado de conversão encontrado para o período selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
