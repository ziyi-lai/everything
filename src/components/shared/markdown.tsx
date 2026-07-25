"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

/**
 * Renders user-authored markdown (captures, task descriptions/comments).
 * react-markdown never renders raw HTML unless rehype-raw is added, so this
 * is XSS-safe by default without a separate sanitizer.
 */
export function Markdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 text-body text-foreground [&>*]:m-0 ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: (props) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-interactive underline" />
          ),
          code: (props) => (
            <code {...props} className="rounded bg-surface-raised px-1 py-0.5 font-mono text-caption" />
          ),
          pre: (props) => (
            <pre {...props} className="overflow-x-auto rounded-lg bg-surface-raised p-3 font-mono text-caption" />
          ),
          ul: (props) => <ul {...props} className="list-disc pl-5" />,
          ol: (props) => <ol {...props} className="list-decimal pl-5" />,
          blockquote: (props) => (
            <blockquote {...props} className="border-l-2 border-border-visible pl-3 text-muted" />
          ),
          h1: (props) => <p {...props} className="text-heading text-hero" />,
          h2: (props) => <p {...props} className="text-subheading text-hero" />,
          h3: (props) => <p {...props} className="text-body font-bold text-hero" />,
          hr: () => <hr className="border-border" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
