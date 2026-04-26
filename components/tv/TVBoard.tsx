'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { User } from 'lucide-react'
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
  if (n <= 8)  return 'lg'
  if (n <= 16) return 'md'
  return 'sm'
}

function getGridCols(n: number): string {
  if (n <= 6)  return 'grid-cols-3'
  if (n <= 8)  return 'grid-cols-4'
  if (n <= 12) return 'grid-cols-4'
  if (n <= 18) return 'grid-cols-6'
  return 'grid-cols-6'
}

interface Props {
  initialEmployees: AiSafeUserProfile[]
  initialOpc: OpcData | null
  initialSettings: SiteSettings | null
  initialPrayerTimes: PrayerTimings | null
}

export default function TVBoard({ initialEmployees, initialOpc, initialSettings, initialPrayerTimes }: Props) {
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
  const adhanPlayedRef = useRef('')
  const adhanAudioRef  = useRef<HTMLAudioElement | null>(null)
  const chimeAudioRef  = useRef<HTMLAudioElement | null>(null)
  const channelUid     = useRef(0)

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
    if (!adhanAudioRef.current) adhanAudioRef.current = new Audio('/audio/adhan.mp3')
    adhanAudioRef.current.play().catch(() => {})
  }, [])

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

    return () => {
      supabase.removeChannel(profileCh)
      supabase.removeChannel(settingsCh)
      supabase.removeChannel(krCh)
    }
  }, [addToast, playChime])

  useEffect(() => {
    const cleanup = subscribeToRealtime()
    return cleanup
  }, [subscribeToRealtime])

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
          {settings?.logo_url ? (
            <Image src={settings.logo_url} alt="Logo" width={180} height={64} className="h-16 w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0B1E3D, #1e3a8a)' }}
              >
                <span className="text-white font-black text-2xl">{(settings?.company_name ?? 'R')[0]}</span>
              </div>
              <span className="text-3xl font-bold" style={{ color: '#0B1E3D' }}>{settings?.company_name ?? 'Rime'}</span>
            </div>
          )}
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
          <div className={`grid ${gridCols} gap-3 h-full content-start`}>
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
    </div>
  )
}
