import { X } from 'lucide-react'

export interface Toast {
  id: string
  message: string
  exiting: boolean
}

interface Props {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export default function NotificationToast({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`bg-slate-900 text-white rounded-xl px-5 py-4 flex items-start gap-3 shadow-2xl pointer-events-auto ${
            t.exiting ? 'toast-exit' : 'toast-enter'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5" />
          <p className="text-base flex-1 leading-snug">{t.message}</p>
          <button
            onClick={() => onDismiss(t.id)}
            className="shrink-0 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
