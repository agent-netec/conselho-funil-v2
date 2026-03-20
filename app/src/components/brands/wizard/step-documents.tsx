import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

interface StepDocumentsProps {
  brandId?: string;
  onFileQueued: (file: File) => void;
  queuedFiles: File[];
}

/**
 * Step 5 — Documents upload in wizard.
 * Since the brand doesn't exist yet, we queue files and upload after creation.
 * For simplicity, we show a dropzone that collects files.
 */
export function StepDocuments({ brandId, onFileQueued, queuedFiles }: StepDocumentsProps) {
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        onFileQueued(files[i]);
      }
    }
  };

  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-2">
        <h3 className="text-base font-medium text-white mb-1">Documentos da Marca</h3>
        <p className="text-xs text-zinc-500">
          Adicione PDFs, manuais ou guias que alimentam o cérebro da sua marca.
          <br />
          Você pode adicionar mais depois na página de edição.
        </p>
      </div>

      {/* Upload area */}
      <div className="relative aspect-[21/9] rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden">
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.svg"
          multiple
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleFiles}
        />
        <FileText className="h-8 w-8 text-zinc-500 mb-3" />
        <p className="text-sm text-zinc-400">Arraste arquivos ou clique para selecionar</p>
        <div className="mt-3 flex gap-2">
          <span className="text-[10px] bg-white/[0.05] text-zinc-400 px-2 py-1 rounded border border-white/[0.05]">PDF, DOCX</span>
          <span className="text-[10px] bg-white/[0.05] text-zinc-400 px-2 py-1 rounded border border-white/[0.05]">TXT, MD</span>
          <span className="text-[10px] bg-white/[0.05] text-zinc-400 px-2 py-1 rounded border border-white/[0.05]">Imagens</span>
        </div>
      </div>

      {/* Queued files list */}
      {queuedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">{queuedFiles.length} arquivo(s) selecionado(s):</p>
          {queuedFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <FileText className="h-4 w-4 text-[#E6B447] shrink-0" />
              <span className="text-xs text-white truncate flex-1">{file.name}</span>
              <span className="text-[10px] text-zinc-500">{(file.size / 1024).toFixed(0)}KB</span>
            </div>
          ))}
          <p className="text-[10px] text-zinc-600">
            Os arquivos serão enviados automaticamente ao criar a marca.
          </p>
        </div>
      )}
    </motion.div>
  );
}
