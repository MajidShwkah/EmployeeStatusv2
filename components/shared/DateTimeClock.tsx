'use client'

import { useEffect, useState } from 'react'
import { formatRiyadhDate, formatRiyadhTime } from '@/lib/utils'

export default function DateTimeClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-center">
      <div
        className="font-black tabular-nums leading-none"
        style={{ fontSize: '3rem', color: '#0f172a', letterSpacing: '-0.03em' }}
      >
        {formatRiyadhTime(now)}
      </div>
      <div className="text-sm font-medium mt-1" style={{ color: '#64748b' }}>
        {formatRiyadhDate(now)}
      </div>
    </div>
  )
}
