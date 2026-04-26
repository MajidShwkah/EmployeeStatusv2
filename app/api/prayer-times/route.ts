import { NextResponse } from 'next/server'
import { fetchPrayerTimes, type PrayerTimings } from '@/lib/prayer'

let fallbackCache: PrayerTimings | null = null

export async function GET() {
  try {
    const timings = await fetchPrayerTimes()
    fallbackCache = timings
    return NextResponse.json(timings, {
      headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
    })
  } catch {
    if (fallbackCache) {
      return NextResponse.json(
        { ...fallbackCache, _cached: true },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }
    return NextResponse.json({ error: 'Prayer times unavailable' }, { status: 503 })
  }
}
