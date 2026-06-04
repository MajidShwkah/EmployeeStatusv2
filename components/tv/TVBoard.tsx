'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { User, Volume2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  getNextPrayer,
  getPrayerCountdownSeconds,
  type PrayerTimings,
  type PrayerName,
} from '@/lib/prayer'
import { formatBusyRemaining, getStatusLabel } from '@/lib/utils'
import type { AiSafeUserProfile, SiteSettings } from '@/lib/supabase/types'
import DateTimeClock from '@/components/shared/DateTimeClock'
import AnnouncementBanner from './AnnouncementBanner'
import EmployeeCard from './EmployeeCard'
import PrayerCountdown from './PrayerCountdown'
import OPCCarousel, { type OpcData } from './OPCCarousel'
import NewsTicker from './NewsTicker'
import NotificationToast, { type Toast } from './NotificationToast'

function isAnnouncementActive(s: SiteSettings | null): boolean {
  if (!s?.is_active || !s.announcement_text) return false
  if (s.announcement_expiry && new Date(s.announcement_expiry) < new Date()) return false
  return true
}

function getCardSize(n: number): 'lg' | 'md' | 'sm' {
  if (n <= 6)  return 'lg'
  if (n <= 12) return 'md'
  return 'sm'
}

function getGridCols(n: number): string {
  if (n <= 4)  return 'grid-cols-2'
  if (n <= 6)  return 'grid-cols-3'
  if (n <= 9)  return 'grid-cols-3'
  if (n <= 12) return 'grid-cols-4'
  if (n <= 16) return 'grid-cols-4'
  return 'grid-cols-5'
}

interface Props {
  initialEmployees: AiSafeUserProfile[]
  initialOpc: OpcData | null
  initialSettings: SiteSettings | null
  initialPrayerTimes: PrayerTimings | null
  initialAdhanUrl: string | null
}

export default function TVBoard({ initialEmployees, initialOpc, initialSettings, initialPrayerTimes, initialAdhanUrl }: Props) {
  const [employees, setEmployees] = useState<AiSafeUserProfile[]>(initialEmployees)
  const [settings, setSettings]   = useState<SiteSettings | null>(initialSettings)
  const [prayerTimes]              = useState<PrayerTimings | null>(initialPrayerTimes)
  const [toasts, setToasts]        = useState<Toast[]>([])
  const [countdown, setCountdown]  = useState(0)
  const [currentPrayer, setCurrentPrayer] = useState<{
    name: PrayerName; time: string; isTomorrow: boolean
  } | null>(null)
  const [carouselState, setCarouselState] = useState({ objIdx: 0, krIdx: 0 })
  const [opc, setOpc]              = useState<OpcData | null>(initialOpc)
  const opcRef                     = useRef<OpcData | null>(initialOpc)
  useEffect(() => { opcRef.current = opc }, [opc])

  const prevStatusRef  = useRef<Map<string, string>>(new Map())
  const adhanPlayedRef   = useRef('')
  const adhanPendingRef  = useRef(false)
  const adhanAudioRef    = useRef<HTMLAudioElement | null>(null)
  const chimeAudioRef    = useRef<HTMLAudioElement | null>(null)
  const channelUid     = useRef(0)
  const adhanUrlRef    = useRef<string | null>(initialAdhanUrl)
  const [adhanUrl, setAdhanUrl] = useState<string | null>(initialAdhanUrl)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  useEffect(() => { adhanUrlRef.current = adhanUrl }, [adhanUrl])

  useEffect(() => {
    initialEmployees.forEach((e) => {
      if (e.id && e.status) prevStatusRef.current.set(e.id, e.status)
    })
  }, [initialEmployees])

  const addToast = useCallback((msg: string) => {
    const id = crypto.randomUUID()
    setToasts((p) => { const t = p.length >= 3 ? p.slice(1) : p; return [...t, { id, message: msg, exiting: false }] })
    setTimeout(() => {
      setToasts((p) => p.map((t) => (t.id === id ? { ...t, exiting: true } : t)))
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 350)
    }, 8000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((p) => p.map((t) => (t.id === id ? { ...t, exiting: true } : t)))
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 350)
  }, [])

  const playChime = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!chimeAudioRef.current) chimeAudioRef.current = new Audio('/audio/notification.mp3')
    chimeAudioRef.current.currentTime = 0
    chimeAudioRef.current.play().catch(() => {})
  }, [])

  const playAdhan = useCallback(() => {
    if (typeof window === 'undefined') return
    const url = adhanUrlRef.current
    if (!url) return
    if (!adhanAudioRef.current || adhanAudioRef.current.src !== url) {
      adhanAudioRef.current = new Audio(url)
    }
    adhanAudioRef.current.currentTime = 0
    adhanAudioRef.current.play().catch(() => { adhanPendingRef.current = true })
  }, [])

  const unlockAudio = useCallback(() => {
    if (audioUnlocked) return
    if (!chimeAudioRef.current) chimeAudioRef.current = new Audio('/audio/notification.mp3')
    const a = chimeAudioRef.current
    a.muted = true
    a.play().then(() => {
      a.pause(); a.muted = false; a.currentTime = 0; setAudioUnlocked(true)
      if (adhanPendingRef.current) { adhanPendingRef.current = false; playAdhan() }
    }).catch(() => { a.muted = false; setAudioUnlocked(true) })
    if (adhanUrlRef.current && !adhanAudioRef.current) {
      adhanAudioRef.current = new Audio(adhanUrlRef.current)
    }
  }, [audioUnlocked, playAdhan])

  const subscribeToRealtime = useCallback(() => {
    const uid      = ++channelUid.current
    const supabase = createClient()

    const profileCh = supabase
      .channel(`tv-profiles-${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const row = payload.new as Record<string, unknown>
          const id  = row.id as string
          if (!id) return
          const safe: Partial<AiSafeUserProfile> & { id: string } = {
            id,
            full_name:         (row.full_name as string)         ?? null,
            avatar_url:        (row.avatar_url as string)        ?? null,
            role:              (row.role as string)              ?? null,
            status:            (row.status as string)            ?? null,
            status_note:       (row.status_note as string)       ?? null,
            busy_until:        (row.busy_until as string)        ?? null,
            status_changed_at: (row.status_changed_at as string) ?? null,
            updated_at:        (row.updated_at as string)        ?? null,
          }
          const prev = prevStatusRef.current.get(id)
          const next = safe.status
          if (prev && next && prev !== next) {
            const remain = next === 'busy' ? formatBusyRemaining(safe.busy_until) : null
            addToast(`${safe.full_name ?? 'Someone'}: ${getStatusLabel(prev)} → ${getStatusLabel(next)}${remain ? ` (${remain})` : ''}`)
            playChime()
          }
          if (next) prevStatusRef.current.set(id, next)
          setEmployees((p) => p.map((e) => (e.id === id ? { ...e, ...safe } : e)))
        } else if (payload.eventType === 'INSERT') {
          const row = payload.new as Record<string, unknown>
          setEmployees((p) => [...p, {
            id: row.id as string ?? null, full_name: row.full_name as string ?? null,
            avatar_url: row.avatar_url as string ?? null, role: row.role as string ?? null,
            status: row.status as string ?? null, status_note: row.status_note as string ?? null,
            busy_until: row.busy_until as string ?? null,
            status_changed_at: row.status_changed_at as string ?? null,
            updated_at: row.updated_at as string ?? null,
          } as AiSafeUserProfile])
        }
      })
      .subscribe()

    const settingsCh = supabase
      .channel(`tv-settings-${uid}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, (p) => {
        setSettings(p.new as SiteSettings)
      })
      .subscribe()

    const krCh = supabase
      .channel(`tv-kr-${uid}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'key_results' }, (payload) => {
        const row = payload.new as { id: string; progress: number; description: string }
        setOpc((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            objectives: prev.objectives.map((obj) => ({
              ...obj,
              keyResults: obj.keyResults.map((kr) =>
                kr.id === row.id ? { ...kr, progress: row.progress, description: row.description } : kr
              ),
            })),
          }
        })
      })
      .subscribe()

    const adhanCh = supabase
      .channel(`tv-adhan-${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'adhan_sounds' }, async () => {
        const { data } = await supabase
          .from('adhan_sounds')
          .select('storage_path')
          .eq('is_default', true)
          .maybeSingle()
        const newPath = data?.storage_path ?? null
        const newUrl = newPath
          ? supabase.storage.from('adhan-sounds').getPublicUrl(newPath).data.publicUrl
          : null
        setAdhanUrl(newUrl)
        if (adhanAudioRef.current && newUrl !== adhanAudioRef.current.src) {
          adhanAudioRef.current.pause()
          adhanAudioRef.current = newUrl ? new Audio(newUrl) : null
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(profileCh)
      supabase.removeChannel(settingsCh)
      supabase.removeChannel(krCh)
      supabase.removeChannel(adhanCh)
    }
  }, [addToast, playChime])

  useEffect(() => {
    const cleanup = subscribeToRealtime()
    return cleanup
  }, [subscribeToRealtime])

  useEffect(() => {
    const handler = () => unlockAudio()
    document.addEventListener('click', handler, { once: true })
    document.addEventListener('touchstart', handler, { once: true })
    return () => {
      document.removeEventListener('click', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [unlockAudio])

  useEffect(() => {
    if (!prayerTimes) return
    const tick = () => {
      const next = getNextPrayer(prayerTimes)
      setCurrentPrayer(next)
      const secs = getPrayerCountdownSeconds(next.time, next.isTomorrow)
      setCountdown(secs)
      if (secs === 0) {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' })
        const key   = `${next.name}-${today}`
        if (adhanPlayedRef.current !== key) { adhanPlayedRef.current = key; playAdhan() }
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [prayerTimes, playAdhan])

  useEffect(() => {
    const id = setInterval(() => {
      const curr = opcRef.current
      if (!curr || curr.objectives.length === 0) return
      setCarouselState((prev) => {
        const obj     = curr.objectives[prev.objIdx % curr.objectives.length]
        const krCount = obj?.keyResults.length ?? 0
        if (prev.krIdx + 1 < krCount) return { ...prev, krIdx: prev.krIdx + 1 }
        return { objIdx: (prev.objIdx + 1) % curr.objectives.length, krIdx: 0 }
      })
    }, 8000)
    return () => clearInterval(id)
  }, [])

  const announcementActive = isAnnouncementActive(settings)
  const cardSize = getCardSize(employees.length)
  const gridCols = getGridCols(employees.length)
  const cached   = !!((prayerTimes as (PrayerTimings & { _cached?: boolean }) | null)?._cached)

  return (
    <div
      className="w-screen h-screen flex flex-col overflow-hidden select-none"
      style={{
        backgroundColor: '#f1f5f9',
        backgroundImage: [
          'radial-gradient(ellipse 60% 40% at 2% 0%, rgba(249,115,22,0.07) 0%, transparent 100%)',
          'radial-gradient(ellipse 50% 45% at 98% 0%, rgba(59,130,246,0.06) 0%, transparent 100%)',
          'radial-gradient(ellipse 70% 50% at 50% 105%, rgba(16,185,129,0.06) 0%, transparent 100%)',
        ].join(', '),
      }}
    >
      {/* ── Header ── */}
      <header
        className="flex items-center px-8 py-4 shrink-0"
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex-1 flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://assets.storydoc.com/118a0181eecb9acac25c9f090b9d7979/b78f45fa-22ba-475b-8e4d-4aa9b2e7037c.webp?b=U3D%252C4X%7Eqxu_3t7RjRjj%255B00%253Fb%253Fb4nM_%2525MxuRj"
            alt={settings?.company_name ?? 'Company Logo'}
            style={{ height: '72px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Center: Clock + Prayer */}
        <div className="flex items-center gap-6 shrink-0">
          <DateTimeClock />
          <div className="h-14 w-px" style={{ background: '#e2e8f0' }} />
          <PrayerCountdown
            prayerName={currentPrayer?.name ?? null}
            prayerTime={currentPrayer?.time ?? null}
            countdown={countdown}
            isTomorrow={currentPrayer?.isTomorrow ?? false}
            cached={cached}
          />
        </div>

        {/* Right: Dashboard */}
        <div className="flex-1 flex items-center justify-end">
          <a
            href="/dashboard"
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-lg text-white transition-opacity hover:opacity-85"
            style={{ background: '#F97316', boxShadow: '0 4px 16px rgba(249,115,22,0.3)' }}
          >
            <User className="w-5 h-5" />
            My Profile
          </a>
        </div>
      </header>

      {/* ── Announcement ── */}
      {announcementActive && <AnnouncementBanner text={settings!.announcement_text!} />}

      {/* ── Notes Bar ── */}
      <NewsTicker employees={employees} tagline={settings?.tagline} />

      {/* ── Employee Cards ── */}
      <main className="flex-1 px-6 py-4 overflow-hidden">
        {employees.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xl">
            No employees yet
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-4 h-full content-start`}>
            {employees.map((emp) => (
              <EmployeeCard key={emp.id ?? emp.full_name} employee={emp} size={cardSize} />
            ))}
          </div>
        )}
      </main>

      {/* ── OPC Carousel ── */}
      {opc && opc.objectives.length > 0 && (
        <OPCCarousel opc={opc} objIdx={carouselState.objIdx} krIdx={carouselState.krIdx} />
      )}

      <NotificationToast toasts={toasts} onDismiss={dismissToast} />

      {audioUnlocked && !adhanUrl && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-xl text-amber-900 text-sm font-medium"
          style={{ background: 'rgba(254,243,199,0.95)', border: '1px solid rgba(245,158,11,0.4)' }}
        >
          <Volume2 className="w-4 h-4" />
          No adhan sound configured
        </div>
      )}
    </div>
  )
}
