import { type PrayerName } from '@/lib/prayer'

const ARABIC: Record<PrayerName, string> = {
  Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء',
}

const ICON: Record<PrayerName, string> = {
  Fajr: '🌄', Dhuhr: '☀️', Asr: '🌤️', Maghrib: '🌇', Isha: '🌙',
}

interface Props {
  prayerName: PrayerName | null
  prayerTime: string | null
  countdown: number
  isTomorrow: boolean
  cached: boolean
}

export default function PrayerCountdown({ prayerName, prayerTime, countdown, isTomorrow, cached }: Props) {
  if (!prayerName || !prayerTime) {
    return (
      <div
        className="flex items-center gap-3 px-6 py-4 rounded-2xl"
        style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0' }}
      >
        <span className="text-3xl">🕌</span>
        <span className="text-slate-400 text-lg font-medium">Loading prayer…</span>
      </div>
    )
  }

  const h = Math.floor(countdown / 3600)
  const m = Math.floor((countdown % 3600) / 60)
  const remaining = countdown === 0 ? 'NOW' : h > 0 ? `${h}h ${m}m` : `${m}m`
  const isNow = countdown === 0
  const isSoon = !isNow && countdown < 1800

  return (
    <div
      className="relative flex items-center gap-5 px-6 py-3 rounded-2xl overflow-hidden"
      style={{
        background: isNow
          ? 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)'
          : 'linear-gradient(135deg, #064e3b 0%, #047857 45%, #059669 100%)',
        border: isNow
          ? '2px solid rgba(251,191,36,0.5)'
          : '2px solid rgba(52,211,153,0.35)',
        boxShadow: isNow
          ? '0 6px 28px rgba(217,119,6,0.45), 0 0 0 1px rgba(251,191,36,0.2)'
          : '0 6px 28px rgba(5,150,105,0.35), 0 0 0 1px rgba(52,211,153,0.15)',
        minWidth: '340px',
      }}
    >
      {/* Decorative arcs */}
      <div
        style={{
          position: 'absolute', right: -25, top: -25,
          width: 140, height: 140, borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.08)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', right: 12, top: -45,
          width: 95, height: 95, borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }}
      />

      {/* Icon */}
      <span style={{ fontSize: '2.6rem', lineHeight: 1, position: 'relative' }}>
        {ICON[prayerName]}
      </span>

      {/* Info */}
      <div className="flex flex-col leading-tight relative">
        {/* Names row — large + clear */}
        <div className="flex items-baseline gap-3">
          <span
            className="font-black text-white"
            style={{ fontSize: '2rem', letterSpacing: '-0.02em', lineHeight: 1 }}
          >
            {isTomorrow ? `${prayerName}` : prayerName}
          </span>
          <span
            className="font-bold"
            style={{
              fontSize: '1.7rem',
              color: isNow ? '#fde68a' : '#a7f3d0',
              fontFamily: '-apple-system, system-ui, "Noto Sans Arabic", sans-serif',
              lineHeight: 1,
            }}
            dir="rtl"
          >
            {ARABIC[prayerName]}
          </span>
          {isTomorrow && (
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>
              tomorrow
            </span>
          )}
        </div>

        {/* Time + countdown row — bold + readable */}
        <div className="flex items-center gap-3 mt-1.5">
          <span
            className="font-bold tabular-nums"
            style={{
              fontSize: '1.3rem',
              color: isNow ? '#fef3c7' : '#d1fae5',
              letterSpacing: '-0.01em',
            }}
          >
            {prayerTime}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.2rem' }}>·</span>
          <span
            className="font-black tabular-nums"
            style={{
              fontSize: '1.5rem',
              color: isNow ? '#ffffff' : isSoon ? '#fcd34d' : '#ffffff',
              letterSpacing: '-0.02em',
              textShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          >
            {remaining}
          </span>
          {cached && <span className="text-amber-200 text-xs ml-1 opacity-70 font-medium">cached</span>}
        </div>
      </div>
    </div>
  )
}
