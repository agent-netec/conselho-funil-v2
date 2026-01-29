'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createProject } from '@/lib/firebase/projects';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Loader2 } from 'lucide-react';

interface NewProjectModalProps {
  brandId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewProjectModal({ brandId, isOpen, onClose, onSuccess }: NewProjectModalProps) {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await createProject({
        brandId,
        userId: user.uid,
        name: name.trim(),
        description: description.trim(),
      });
      setName('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Crie um novo projeto para organizar suas entregas nesta marca.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Nome do Projeto</label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Lançamento Março 2026"
              className="bg-white/5 border-white/10 text-white focus:border-emerald-500/50 transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Descrição (Opcional)</label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo deste projeto..."
              className="bg-white/5 border-white/10 text-white focus:border-emerald-500/50 min-h-[100px] transition-colors"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Projeto'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



