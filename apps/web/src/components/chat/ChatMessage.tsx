import type { UIMessage } from 'ai'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: UIMessage
}

const markdownComponents = {
  table: ({ children }: { children?: React.ReactNode }) => (
    <table className="w-full text-xs border-collapse my-2">{children}</table>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="text-left px-2 py-1 border border-neutral-700 text-neutral-300 font-medium bg-neutral-800">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-2 py-1 border border-neutral-700 text-neutral-400">{children}</td>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-neutral-800 px-1 rounded text-xs text-blue-300">{children}</code>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-neutral-100">{children}</strong>
  ),
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-1 last:mb-0">{children}</p>,
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  const textContent = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('')

  if (!textContent) return null

  return (
    <div className={cn('flex w-full gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground mt-0.5">
          T1
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed',
          isUser ? 'bg-primary/15 text-foreground' : 'bg-card border border-border text-foreground',
        )}
      >
        {isUser ? (
          textContent
        ) : (
          <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {textContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
