'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Library,
  Search,
  Filter,
  Target,
  Users,
  Zap,
  Star,
  Copy,
  ChevronRight,
  Layers,
  TrendingUp,
  Package,
  Calendar,
  ArrowRight,
  Sparkles,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LibraryTemplate, ProposalScorecard } from '@/types/database';

const OBJECTIVE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  leads: { label: 'Leads', icon: '📧', color: 'text-blue-400' },
  sales: { label: 'Vendas', icon: '💰', color: 'text-emerald-400' },
  calls: { label: 'Calls', icon: '📞', color: 'text-amber-400' },
  retention: { label: 'Retenção', icon: '🔄', color: 'text-purple-400' },
};

const FILTER_OPTIONS = [
  { id: 'all', label: 'Todos' },
  { id: 'leads', label: 'Leads' },
  { id: 'sales', label: 'Vendas' },
  { id: 'calls', label: 'Calls' },
  { id: 'retention', label: 'Retenção' },
];

function TemplateCard({ template, onUse }: { template: LibraryTemplate; onUse: () => void }) {
  const objective = template.metadata?.objective as string;
  const config = OBJECTIVE_CONFIG[objective] || { label: 'Funil', icon: '🎯', color: 'text-zinc-400' };
  const metadata = template.metadata as Record<string, unknown> | undefined;
  const scorecard = metadata?.scorecard as ProposalScorecard | undefined;
  const stages = (metadata?.stages as number) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-5 hover:border-emerald-500/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50 text-2xl">
            {config.icon}
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
              {template.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className={config.color}>{config.label}</span>
              {template.metadata?.vertical && (
                <>
                  <span>•</span>
                  <span>{template.metadata.vertical}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {scorecard && (
          <div className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium',
            scorecard.overall >= 7.5 ? 'bg-emerald-500/10 text-emerald-400' :
            scorecard.overall >= 6 ? 'bg-amber-500/10 text-amber-400' : 
            'bg-zinc-500/10 text-zinc-400'
          )}>
            <Star className="h-3.5 w-3.5" />
            {scorecard.overall.toFixed(1)}
          </div>
        )}
      </div>

      <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
        {template.description}
      </p>

      <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
        <div className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          {stages} etapas
        </div>
        {metadata?.channel ? (
          <div className="flex items-center gap-1">
            <Target className="h-3.5 w-3.5" />
            {String(metadata.channel)}
          </div>
        ) : null}
        {metadata?.ticket ? (
          <div className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            {String(metadata.ticket)}
          </div>
        ) : null}
        <div className="flex items-center gap-1">
          <Copy className="h-3.5 w-3.5" />
          {template.usageCount}x usado
        </div>
      </div>

      {template.metadata?.tags && template.metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {template.metadata.tags.slice(0, 4).map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-0.5 bg-zinc-800/50 rounded text-xs text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <Button
        onClick={onUse}
        className="w-full btn-accent h-10"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Usar Template
      </Button>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-12 text-center"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-800/50 mb-6">
        <FolderOpen className="h-10 w-10 text-zinc-600" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        Biblioteca Vazia
      </h3>
      <p className="text-zinc-400 mb-6 max-w-md mx-auto">
        Você ainda não salvou nenhum template. Crie um funil, aprove uma proposta 
        e salve na biblioteca para reutilizar no futuro.
      </p>
      <Link href="/funnels/new">
        <Button className="btn-accent">
          <Target className="mr-2 h-4 w-4" />
          Criar Primeiro Funil
        </Button>
      </Link>
    </motion.div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<LibraryTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/library');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTemplate = (template: LibraryTemplate) => {
    // Navigate to new funnel page with template data
    const params = new URLSearchParams({
      templateId: template.id,
      name: template.name,
    });
    router.push(`/funnels/new?${params.toString()}`);
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || 
      template.metadata?.objective === activeFilter;

    return matchesSearch && matchesFilter;
  });

  // Group by objective for stats
  const stats = {
    total: templates.length,
    leads: templates.filter(t => t.metadata?.objective === 'leads').length,
    sales: templates.filter(t => t.metadata?.objective === 'sales').length,
    calls: templates.filter(t => t.metadata?.objective === 'calls').length,
    retention: templates.filter(t => t.metadata?.objective === 'retention').length,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="Biblioteca"
        subtitle="Templates de funis aprovados"
        actions={
          <Link href="/funnels/new">
            <Button className="btn-accent">
              <Target className="mr-2 h-4 w-4" />
              Novo Funil
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
          >
            {[
              { label: 'Total', value: stats.total, icon: Library, color: 'text-zinc-400' },
              { label: 'Leads', value: stats.leads, icon: Users, color: 'text-blue-400' },
              { label: 'Vendas', value: stats.sales, icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Calls', value: stats.calls, icon: Zap, color: 'text-amber-400' },
              { label: 'Retenção', value: stats.retention, icon: Target, color: 'text-purple-400' },
            ].map((stat, index) => (
              <div key={stat.label} className="card-premium p-4 text-center">
                <stat.icon className={cn('h-5 w-5 mx-auto mb-2', stat.color)} />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar templates..."
                className="pl-10 input-premium"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              {FILTER_OPTIONS.map((filter) => (
                <Button
                  key={filter.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    'whitespace-nowrap',
                    activeFilter === filter.id
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Templates Grid */}
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card-premium p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-zinc-800" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-zinc-800 rounded mb-2" />
                      <div className="h-3 w-24 bg-zinc-800 rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-full bg-zinc-800 rounded mb-2" />
                  <div className="h-3 w-3/4 bg-zinc-800 rounded mb-4" />
                  <div className="h-10 w-full bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {filteredTemplates.map((template, index) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={() => handleUseTemplate(template)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* CTA */}
          {templates.length > 0 && templates.length < 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12 card-premium p-8 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 mb-4">
                <Sparkles className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Cresça sua biblioteca
              </h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Cada funil aprovado pode virar um template. Quanto mais templates, 
                mais rápido você cria novos funis no futuro.
              </p>
              <Link href="/funnels">
                <Button variant="outline" className="btn-ghost">
                  Ver Funis Aprovados
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
