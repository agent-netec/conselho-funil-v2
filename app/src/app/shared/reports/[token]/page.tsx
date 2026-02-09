'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  Target, 
  ArrowRight,
  Calendar,
  Activity,
  BarChart3,
  MessageSquare,
  CheckSquare,
  ExternalLink,
  ShieldCheck,
  ZapOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agency, AgencyClient } from '@/types/agency';
import type { AnomalyAlert, ClientReport } from '@/types/reporting';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.21, 0.47, 0.32, 0.98] as const
    }
  }
};

export default function ClientReportPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [report, setReport] = useState<ClientReport | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [client, setClient] = useState<AgencyClient | null>(null);
  const [anomaly, setAnomaly] = useState<AnomalyAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReportData() {
      try {
        // 1. Buscar o relatório pelo token
        // Nota: Em um sistema real, o token seria validado via API ou uma collection de 'shared_links'
        // Para este MVP, estamos buscando diretamente na collection de reports (assumindo que o token é o ID ou um campo indexado)
        const reportsRef = collection(db, 'reports');
        const q = query(reportsRef, where('sharingToken', '==', token), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError('Relatório não encontrado ou link expirado.');
          setIsLoading(false);
          return;
        }

        const reportData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ClientReport;
        setReport(reportData);

        // 2. Buscar dados da Agência (White-Label)
        const agencyDoc = await getDoc(doc(db, 'agencies', reportData.agencyId));
        if (agencyDoc.exists()) {
          setAgency({ id: agencyDoc.id, ...agencyDoc.data() } as Agency);
        }

        // 3. Buscar dados do Cliente
        const clientDoc = await getDoc(doc(db, 'agencies', reportData.agencyId, 'clients', reportData.clientId));
        if (clientDoc.exists()) {
          setClient({ id: clientDoc.id, ...clientDoc.data() } as AgencyClient);
        }

        // 4. Verificar anomalias recentes (ST-24.2)
        const alertsRef = collection(db, 'agencies', reportData.agencyId, 'clients', reportData.clientId, 'alerts');
        const alertsQuery = query(alertsRef, where('status', '==', 'new'), limit(1));
        const alertsSnap = await getDocs(alertsQuery);
        if (!alertsSnap.empty) {
          setAnomaly({ id: alertsSnap.docs[0].id, ...alertsSnap.docs[0].data() } as AnomalyAlert);
        }

      } catch (err) {
        console.error('Error loading report:', err);
        setError('Erro ao carregar os dados do relatório.');
      } finally {
        setIsLoading(false);
      }
    }

    if (token) loadReportData();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-2 border-emerald-500 animate-spin" />
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-emerald-500 animate-pulse" />
        </div>
        <p className="text-zinc-500 font-medium animate-pulse">Sintonizando com o Conselho...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 mb-4">
            <ZapOff className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Acesso Interrompido</h1>
          <p className="text-zinc-400">{error || 'Não foi possível carregar este relatório.'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-medium"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: client?.config.currency || 'BRL'
    }).format(value);
  };

  const formatDate = (ts: Timestamp) => {
    return ts.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Cores dinâmicas (White-Label)
  const primaryBrand = agency?.branding.colors.primary || '#10b981'; // Default emerald-500
  const secondaryBrand = agency?.branding.colors.secondary || '#3b82f6'; // Default blue-500

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 selection:bg-emerald-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-grid-white/[0.02] pointer-events-none" />

      <main className="relative max-w-3xl mx-auto px-5 py-8 md:py-12 space-y-10">
        
        {/* 1. Header de Autoridade (White-Label) */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="space-y-3">
            {agency?.branding.logoUrl ? (
              <img 
                src={agency.branding.logoUrl} 
                alt={agency.name} 
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="flex items-center gap-2 text-white font-bold text-xl">
                <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 fill-white" />
                </div>
                {agency?.name || 'Conselho de Funil'}
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
                <Calendar className="h-3.5 w-3.5" />
                Relatório {report.type === 'weekly' ? 'Semanal' : 'Mensal'}: {formatDate(report.period.start)} - {formatDate(report.period.end)}
              </div>
              
              {/* Status de Saúde (Glow Dot) */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-xs font-medium text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                ROI Saudável
              </div>
            </div>
          </div>

          {anomaly && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl"
            >
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Otimização em Curso</span>
            </motion.div>
          )}
        </motion.header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-10"
        >
          {/* 2. Seção: "A Voz do Conselho" (AI Narrative) */}
          <motion.section variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              A Voz do Conselho
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-2xl backdrop-blur-sm">
                <p className="text-lg md:text-xl text-white leading-relaxed font-serif italic">
                  "{report.aiAnalysis.summary}"
                </p>
                <div className="mt-6 pt-6 border-t border-zinc-800/50 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    {report.aiAnalysis.dataContext}
                  </span>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-6 w-6 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-br from-emerald-500 to-blue-600 opacity-50" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 3. Seção: "Insights & Recomendações" */}
          <motion.section variants={itemVariants} className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Insights & Recomendações
            </div>
            
            <div className="grid gap-4">
              {report.aiAnalysis.insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                  <div className={cn(
                    "mt-1 p-2 rounded-lg",
                    insight.type === 'lamp' ? "bg-amber-500/10 text-amber-500" :
                    insight.type === 'target' ? "bg-blue-500/10 text-blue-500" :
                    "bg-red-500/10 text-red-500"
                  )}>
                    {insight.type === 'lamp' && <Lightbulb className="h-4 w-4" />}
                    {insight.type === 'target' && <Target className="h-4 w-4" />}
                    {insight.type === 'alert' && <AlertCircle className="h-4 w-4" />}
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-emerald-500" />
                Plano de Ação (Agência)
              </h4>
              <div className="space-y-3">
                {report.aiAnalysis.actionPlan.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3 group">
                    <div className="h-5 w-5 rounded border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center">
                      <CheckSquare className="h-3 w-3 text-emerald-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* 4. Seção: "Snapshot de Performance" */}
          <motion.section variants={itemVariants} className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              <Activity className="h-4 w-4 text-blue-400" />
              Snapshot de Performance
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Investimento</p>
                <p className="text-lg font-bold text-white">{formatCurrency(report.metrics.adSpend)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Receita</p>
                <p className="text-lg font-bold text-white">{formatCurrency(report.metrics.revenue)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">ROI Atual</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-lg font-bold text-emerald-400">{report.metrics.roi.toFixed(2)}x</p>
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Maturidade LTV</p>
                <p className="text-lg font-bold text-blue-400">{Math.round(report.metrics.ltvMaturation * 100)}%</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* ROI Real vs Preditivo */}
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">ROI: Real vs Preditivo</h4>
                  <BarChart3 className="h-4 w-4 text-zinc-600" />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Realidade</span>
                      <span className="text-white font-bold">{report.metrics.roi.toFixed(1)}x</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((report.metrics.roi / 5) * 100, 100)}%` }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Predição (IA)</span>
                      <span className="text-zinc-400 font-bold">{(report.metrics.roiPredicted || 0).toFixed(1)}x</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(((report.metrics.roiPredicted || 0) / 5) * 100, 100)}%` }}
                        className="h-full bg-zinc-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* LTV Maturation */}
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Maturação de Lucro (LTV)</h4>
                  <Activity className="h-4 w-4 text-zinc-600" />
                </div>
                <div className="flex flex-col items-center justify-center py-2 space-y-4">
                  <div className="relative h-24 w-24">
                    <svg className="h-full w-full" viewBox="0 0 36 36">
                      <path
                        className="text-zinc-800 stroke-current"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <motion.path
                        initial={{ strokeDasharray: "0, 100" }}
                        animate={{ strokeDasharray: `${report.metrics.ltvMaturation * 100}, 100` }}
                        className="text-blue-500 stroke-current"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">{Math.round(report.metrics.ltvMaturation * 100)}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-center text-zinc-500 leading-relaxed px-4">
                    Percentual do valor investido que já retornou como lucro líquido acumulado.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>

        {/* 5. Footer de Parceria */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="pt-12 pb-6 space-y-8"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Dúvidas sobre os dados?</h3>
              <p className="text-zinc-500 text-sm">Seu gestor de conta está pronto para discutir os próximos passos.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href={`https://wa.me/${client?.contactInfo.phone?.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                <MessageSquare className="h-5 w-5" />
                Falar com meu Gestor
              </a>
              <a 
                href={`mailto:${client?.contactInfo.email}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all"
              >
                Enviar E-mail
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2 grayscale opacity-50">
              <Zap className="h-3 w-3" />
              Powered by Conselho de Funil
            </div>
            <div className="flex gap-6">
              <span>Privacidade</span>
              <span>Termos</span>
              <span>© 2026 {agency?.name}</span>
            </div>
          </div>
        </motion.footer>
      </main>

      {/* Custom Styles for Grid Background */}
      <style jsx global>{`
        .bg-grid-white {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.04)'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
}
