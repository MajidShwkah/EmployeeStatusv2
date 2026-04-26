import { AlertTriangle } from 'lucide-react'

interface Props {
  text: string
}

export default function AnnouncementBanner({ text }: Props) {
  return (
    <div
      className="w-full shrink-0 flex items-center gap-4 px-8 py-4"
      style={{
        background: 'linear-gradient(90deg, #7c2d12 0%, #c2410c 40%, #b45309 70%, #7c2d12 100%)',
        borderBottom: '1px solid rgba(251, 146, 60, 0.3)',
      }}
    >
      <div
        className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
      >
        <AlertTriangle className="w-5 h-5 text-orange-100" />
      </div>

      <p className="flex-1 text-white text-xl font-bold tracking-wide">{text}</p>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-orange-200 animate-pulse" />
        <span className="w-2.5 h-2.5 rounded-full bg-orange-200 animate-pulse" style={{ animationDelay: '200ms' }} />
        <span className="w-2.5 h-2.5 rounded-full bg-orange-200 animate-pulse" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  )
}
