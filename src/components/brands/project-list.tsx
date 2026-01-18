'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/types/database';
import { getBrandProjects, deleteProject } from '@/lib/firebase/projects';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  Plus, 
  MoreVertical, 
  Trash2, 
  ExternalLink,
  Clock,
  CheckCircle2,
  Archive
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NewProjectModal } from './new-project-modal';
import { motion } from 'framer-motion';

interface ProjectListProps {
  brandId: string;
}

export function ProjectList({ brandId }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [brandId]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await getBrandProjects(brandId);
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      await deleteProject(projectId);
      loadProjects();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Projetos</h2>
        <Button 
          onClick={() => setIsModalOpen(true)}
          size="sm" 
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-zinc-700 mb-4" />
          <h3 className="text-white font-medium mb-1">Nenhum projeto ainda</h3>
          <p className="text-sm text-zinc-500 mb-6">Comece organizando seus funis e copies em projetos.</p>
          <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm">
            Criar Primeiro Projeto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{project.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {project.updatedAt?.toDate 
                        ? new Date(project.updatedAt.toDate()).toLocaleDateString()
                        : 'Recém criado'}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      project.status === 'active' 
                        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' 
                        : 'border-zinc-500/30 text-zinc-400 bg-zinc-500/5'
                    }`}>
                      {project.status === 'active' ? 'Ativo' : project.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  Abrir <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                    <DropdownMenuItem className="hover:bg-white/5">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                      Concluir
                    </DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/5">
                      <Archive className="mr-2 h-4 w-4 text-zinc-500" />
                      Arquivar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-400 hover:bg-red-500/10"
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <NewProjectModal 
        brandId={brandId} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={loadProjects}
      />
    </div>
  );
}



