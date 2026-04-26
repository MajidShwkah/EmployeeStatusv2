export function getStatusAccentClass(status: string | null): string {
  switch (status) {
    case 'available': return 'text-green-600'
    case 'busy': return 'text-red-500'
    case 'important': return 'text-amber-500'
    default: return 'text-slate-400'
  }
}

export function getStatusCardClass(status: string | null): string {
  switch (status) {
    case 'available': return 'bg-green-50 border-green-200'
    case 'busy': return 'bg-red-50 border-red-200'
    case 'important': return 'bg-amber-50 border-amber-200'
    default: return 'bg-slate-50 border-slate-200'
  }
}

export function getStatusDotClass(status: string | null): string {
  switch (status) {
    case 'available': return 'bg-green-500'
    case 'busy': return 'bg-red-500'
    case 'important': return 'bg-amber-500'
    default: return 'bg-slate-400'
  }
}

export function getStatusLabel(status: string | null): string {
  switch (status) {
    case 'available': return 'Available'
    case 'busy': return 'Busy'
    case 'important': return 'Important'
    default: return 'Unknown'
  }
}

export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}

export function getAvatarBgClass(name: string | null | undefined): string {
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500',
    'bg-indigo-500', 'bg-orange-500', 'bg-cyan-500', 'bg-rose-500',
  ]
  if (!name) return colors[0]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Unknown'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

export function isStaleStatus(statusChangedAt: string | null | undefined): boolean {
  if (!statusChangedAt) return true
  return Date.now() - new Date(statusChangedAt).getTime() > 3 * 60 * 60 * 1000
}

export function formatBusyRemaining(busyUntil: string | null | undefined): string | null {
  if (!busyUntil) return null
  const diffMs = new Date(busyUntil).getTime() - Date.now()
  if (diffMs <= 0) return null
  const mins = Math.ceil(diffMs / 60_000)
  if (mins < 60) return `${mins} min left`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m left` : `${h}h left`
}

export function sanitizeText(text: string, maxLength = 500): string {
  return text.trim().replace(/[<>]/g, '').slice(0, maxLength)
}

export function formatRiyadhTime(date: Date): string {
  return new Intl.DateTimeFormat('en-SA', {
    timeZone: 'Asia/Riyadh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatRiyadhDate(date: Date): string {
  return new Intl.DateTimeFormat('en-SA', {
    timeZone: 'Asia/Riyadh',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
