import Image from 'next/image'
import {
  getInitials,
  getAvatarBgClass,
  isStaleStatus,
  formatTimeAgo,
  formatBusyRemaining,
} from '@/lib/utils'
import type { AiSafeUserProfile } from '@/lib/supabase/types'

interface Props {
  employee: AiSafeUserProfile
  size?: 'lg' | 'md' | 'sm'
}

const ST = {
  available: {
    label:  'Available',
    bg:     'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    border: '#166534',
    dot:    '#86efac',
    text:   '#dcfce7',
    name:   '#ffffff',
    time:   'rgba(255,255,255,0.75)',
    glow:   'rgba(22,163,74,0.45)',
  },
  busy: {
    label:  'Busy',
    bg:     'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    border: '#991b1b',
    dot:    '#fecaca',
    text:   '#fee2e2',
    name:   '#ffffff',
    time:   'rgba(255,255,255,0.75)',
    glow:   'rgba(220,38,38,0.45)',
  },
  important: {
    label:  'Important',
    bg:     'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    border: '#c2410c',
    dot:    '#fed7aa',
    text:   '#ffedd5',
    name:   '#ffffff',
    time:   'rgba(255,255,255,0.8)',
    glow:   'rgba(249,115,22,0.45)',
  },
}
const STALE = {
  label:  'No update',
  bg:     'linear-gradient(135deg, #64748b 0%, #475569 100%)',
  border: '#334155',
  dot:    '#cbd5e1',
  text:   '#e2e8f0',
  name:   '#ffffff',
  time:   'rgba(255,255,255,0.65)',
  glow:   'rgba(100,116,139,0.35)',
}

const SIZE = {
  lg: { pad: 'p-6',   av: 120, init: 'text-5xl', name: 'text-3xl', badge: 'text-xl',  detail: 'text-base', dot: 16 },
  md: { pad: 'p-5',   av: 96,  init: 'text-4xl', name: 'text-2xl', badge: 'text-lg',  detail: 'text-sm',   dot: 13 },
  sm: { pad: 'p-4',   av: 72,  init: 'text-3xl', name: 'text-xl',  badge: 'text-base',detail: 'text-sm',   dot: 11 },
}

export default function EmployeeCard({ employee, size = 'md' }: Props) {
  const s     = SIZE[size]
  const stale = isStaleStatus(employee.status_changed_at)
  const st    = stale ? STALE : (ST[employee.status as keyof typeof ST] ?? STALE)
  const busy  = formatBusyRemaining(employee.busy_until)

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl ${s.pad}`}
      style={{
        background: st.bg,
        border: `1.5px solid ${st.border}`,
        boxShadow: `0 6px 20px ${st.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
      }}
    >
      {/* Avatar */}
      <div
        className="rounded-full overflow-hidden shrink-0"
        style={{
          width: s.av,
          height: s.av,
          boxShadow: `0 0 0 3px rgba(255,255,255,0.45), 0 4px 12px rgba(0,0,0,0.2)`,
        }}
      >
        {employee.avatar_url ? (
          <Image
            src={employee.avatar_url}
            alt={employee.full_name ?? 'Employee'}
            width={s.av}
            height={s.av}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-white font-bold ${s.init} ${getAvatarBgClass(employee.full_name)}`}>
            {getInitials(employee.full_name)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0">
        <p className={`font-bold truncate leading-tight ${s.name}`} style={{ color: st.name }}>
          {employee.full_name ?? 'Unknown'}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className="rounded-full shrink-0"
            style={{ width: s.dot, height: s.dot, background: st.dot, boxShadow: `0 0 6px ${st.dot}` }}
          />
          <span className={`font-bold ${s.badge}`} style={{ color: st.text, textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
            {st.label}
          </span>
        </div>
        <p className={`${s.detail} mt-0.5 font-medium`} style={{ color: st.time }}>
          {employee.status === 'busy' && busy ? busy : formatTimeAgo(employee.status_changed_at)}
        </p>
      </div>
    </div>
  )
}
