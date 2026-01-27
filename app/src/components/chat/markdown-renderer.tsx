'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  components?: any;
}

export function MarkdownRenderer({ content, className, components }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        'prose prose-invert prose-sm max-w-none',
        // ...
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
          ...components,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

