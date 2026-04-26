export interface PrayerTimings {
  Fajr: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
  _cached?: boolean
}

export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'
export const PRAYER_NAMES: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

export async function fetchPrayerTimes(): Promise<PrayerTimings> {
  const res = await fetch(
    'https://api.aladhan.com/v1/timingsByCity?city=Riyadh&country=Saudi+Arabia&method=4',
    { next: { revalidate: 86400 } }
  )
  if (!res.ok) throw new Error(`Prayer API error: ${res.status}`)
  const data = await res.json()
  const t = data.data.timings
  return { Fajr: t.Fajr, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha }
}

function getRiyadhMinutes(date: Date): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Riyadh',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const parts = fmt.formatToParts(date)
  const h = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0')
  const m = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0')
  return (h === 24 ? 0 : h) * 60 + m
}

export function getNextPrayer(
  timings: PrayerTimings
): { name: PrayerName; time: string; isTomorrow: boolean } {
  const now = new Date()
  const currentMinutes = getRiyadhMinutes(now)

  for (const name of PRAYER_NAMES) {
    const [h, m] = timings[name].split(':').map(Number)
    if (h * 60 + m > currentMinutes) {
      return { name, time: timings[name], isTomorrow: false }
    }
  }

  return { name: 'Fajr', time: timings.Fajr, isTomorrow: true }
}

export function getPrayerCountdownSeconds(
  prayerTimeStr: string,
  isTomorrow: boolean,
  now: Date = new Date()
): number {
  const riyadhDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' }) // YYYY-MM-DD
  const [h, m] = prayerTimeStr.split(':').map(Number)
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  const target = new Date(`${riyadhDateStr}T${hh}:${mm}:00+03:00`)
  if (isTomorrow) target.setUTCDate(target.getUTCDate() + 1)
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000))
}

export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}
