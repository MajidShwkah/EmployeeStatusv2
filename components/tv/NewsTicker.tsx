'use client'

import Image from 'next/image'
import { getInitials, getAvatarBgClass } from '@/lib/utils'

interface Employee {
  id: string | null
  full_name: string | null
  avatar_url: string | null
  status_note: string | null
  status: string | null
}

interface Props {
  employees: Employee[]
  tagline?: string | null
}

const STATUS_COLOR: Record<string, string> = {
  available: '#16a34a',
  busy:      '#dc2626',
  important: '#f97316',
}

function NoteCard({ emp }: { emp: Employee }) {
  const color = STATUS_COLOR[emp.status ?? ''] ?? '#94a3b8'
  return (
    <div
      className="flex items-center gap-5 px-6 py-4 rounded-2xl shrink-0 mx-3"
      style={{
        background: '#ffffff',
        border: `2px solid ${color}40`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        minWidth: '480px',
        maxWidth: '680px',
      }}
    >
      <div
        className="rounded-full overflow-hidden shrink-0"
        style={{ width: 72, height: 72, boxShadow: `0 0 0 3px ${color}` }}
      >
        {emp.avatar_url ? (
          <Image src={emp.avatar_url} alt={emp.full_name ?? ''} width={72} height={72} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-white font-bold text-2xl ${getAvatarBgClass(emp.full_name)}`}>
            {getInitials(emp.full_name)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-bold text-lg leading-tight truncate" style={{ color: '#64748b' }}>
          {emp.full_name ?? '—'}
        </p>
        <p
          className="font-semibold mt-1.5 line-clamp-2"
          style={{
            fontSize: '1.5rem',
            lineHeight: 1.4,
            color: '#1e293b',
            fontFamily: '-apple-system, system-ui, "Noto Sans Arabic", sans-serif',
          }}
          dir="auto"
        >
          {emp.status_note}
        </p>
      </div>

      <div
        className="shrink-0 w-3.5 h-3.5 rounded-full self-start mt-1.5"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
    </div>
  )
}

export default function NewsTicker({ employees, tagline }: Props) {
  const noted = employees.filter((e) => e.status_note?.trim())

  if (noted.length === 0 && !tagline) return null

  if (noted.length === 0) {
    return (
      <div
        className="w-full shrink-0 flex items-center justify-center"
        style={{
          height: '72px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <p className="text-slate-400 text-2xl italic" style={{ fontFamily: '-apple-system, system-ui, sans-serif' }}>
          {tagline}
        </p>
      </div>
    )
  }

  const items    = noted.length < 4 ? [...noted, ...noted, ...noted] : [...noted, ...noted]
  const duration = Math.max(30, noted.length * 10)

  return (
    <div
      className="w-full shrink-0 overflow-hidden flex items-center"
      style={{
        height: '148px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div className="notes-marquee" style={{ animationDuration: `${duration}s`, paddingLeft: '1rem' }}>
        {items.map((emp, i) => (
          <NoteCard key={`${emp.id ?? emp.full_name}-${i}`} emp={emp} />
        ))}
      </div>
    </div>
  )
}
