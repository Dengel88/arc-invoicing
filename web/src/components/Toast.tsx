import {useEffect} from 'react'
import {AlertTriangle, CheckCircle2, ExternalLink, Loader2, X} from 'lucide-react'
import {explorerTx} from '../lib/chain'

export type ToastKind = 'pending' | 'success' | 'error'

export type ToastState = {
  id: number
  kind: ToastKind
  title: string
  detail?: string
  hash?: string
}

const LOOK = {
  pending: {ring: 'ring-brand/30', accent: 'text-brand', Icon: Loader2, spin: true},
  success: {ring: 'ring-paid/30', accent: 'text-paid', Icon: CheckCircle2, spin: false},
  error: {ring: 'ring-danger/30', accent: 'text-danger', Icon: AlertTriangle, spin: false},
} as const

export function Toast({toast, onDismiss}: {toast: ToastState; onDismiss: () => void}) {
  const {ring, accent, Icon, spin} = LOOK[toast.kind]

  // Success auto-dismisses; errors and in-flight transactions stay until the user
  // acts, because those are the two the user actually needs to read.
  useEffect(() => {
    if (toast.kind !== 'success') return
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [toast.id, toast.kind, onDismiss])

  return (
    <div
      // `status` + polite announces without stealing focus mid-transaction.
      role="status"
      aria-live="polite"
      className={`animate-slide-in pointer-events-auto w-full max-w-sm rounded-xl border border-line bg-raised/95 p-4 shadow-2xl shadow-black/50 ring-1 ring-inset backdrop-blur ${ring}`}
    >
      <div className="flex gap-3">
        <Icon
          className={`mt-0.5 size-5 shrink-0 ${accent} ${spin ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{toast.title}</p>
          {toast.detail && (
            <p className="mt-1 text-sm leading-snug text-muted [overflow-wrap:anywhere]">
              {toast.detail}
            </p>
          )}
          {toast.hash && (
            <a
              href={explorerTx(toast.hash)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand transition-colors duration-200 hover:text-brand-hi"
            >
              View on Arc explorer
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="-m-2 grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg text-faint transition-colors duration-200 hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export function ToastStack({toasts, onDismiss}: {toasts: ToastState[]; onDismiss: (id: number) => void}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-3 p-4 sm:items-end sm:p-6">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}
