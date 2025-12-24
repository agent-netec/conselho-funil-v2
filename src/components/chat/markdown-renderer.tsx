'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        'prose prose-invert prose-sm max-w-none',
        // Headers
        'prose-headings:text-white prose-headings:font-semibold',
        'prose-h1:text-xl prose-h1:mt-4 prose-h1:mb-2',
        'prose-h2:text-lg prose-h2:mt-3 prose-h2:mb-2 prose-h2:text-emerald-400',
        'prose-h3:text-base prose-h3:mt-2 prose-h3:mb-1',
        // Paragraphs
        'prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:my-2',
        // Strong/Bold
        'prose-strong:text-white prose-strong:font-semibold',
        // Code
        'prose-code:text-emerald-400 prose-code:bg-emerald-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
        // Code blocks
        'prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg',
        // Blockquotes
        'prose-blockquote:border-l-emerald-500/50 prose-blockquote:bg-emerald-500/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r prose-blockquote:text-zinc-400 prose-blockquote:not-italic',
        // Lists
        'prose-ul:text-zinc-300 prose-ul:my-2',
        'prose-ol:text-zinc-300 prose-ol:my-2',
        'prose-li:marker:text-emerald-500 prose-li:my-0.5',
        // Tables
        'prose-table:border-collapse prose-table:w-full',
        'prose-th:bg-zinc-800/50 prose-th:text-zinc-200 prose-th:p-2 prose-th:text-left prose-th:border prose-th:border-white/10',
        'prose-td:p-2 prose-td:border prose-td:border-white/10 prose-td:text-zinc-300',
        // Links
        'prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline',
        // HR
        'prose-hr:border-white/10',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom table wrapper for horizontal scroll - avoid className prop issue
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-white/10">
              <table className="min-w-full" {...props} />
            </div>
          ),
          // Custom code block - avoid className prop issue
          pre: ({ node, ...props }) => (
            <pre className="overflow-x-auto p-4 text-sm" {...props} />
          ),
          // Fix code element
          code: ({ node, inline, ...props }: { node?: unknown; inline?: boolean; [key: string]: unknown }) => (
            <code {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

