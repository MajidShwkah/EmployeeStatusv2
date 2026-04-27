'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { getStatusLabel, getStatusCardClass, formatBusyRemaining } from '@/lib/utils'
import type { Status } from '@/lib/supabase/types'
import BusyDurationModal from './BusyDurationModal'

const STATUS_OPTIONS: {
  status: Status
  label: string
  description: string
  icon: React.ReactNode
  btn: string
}[] = [
  {
    status: 'available',
    label: 'Available',
    description: 'Reachable and ready',
    icon: <CheckCircle className="w-6 h-6" />,
    btn: 'bg-green-500 hover:bg-green-600 border-green-600 text-white',
  },
  {
    status: 'busy',
    label: 'Busy',
    description: 'Do not disturb unless urgent',
    icon: <Clock className="w-6 h-6" />,
    btn: 'bg-red-500 hover:bg-red-600 border-red-600 text-white',
  },
  {
    status: 'important',
    label: 'Important',
    description: 'Available for important matters',
    icon: <AlertCircle className="w-6 h-6" />,
    btn: 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white',
  },
]

interface Props {
  currentStatus: Status
  busyUntil: string | null
}

export default function StatusSwitcher({ currentStatus, busyUntil }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [currentBusyUntil, setCurrentBusyUntil] = useState(busyUntil)
  const [showBusyModal, setShowBusyModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeStatus = async (newStatus: Status, busyMinutes?: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, busyMinutes }),
      })
      if (res.status === 429) {
        setError('Too many changes. Please wait a minute.')
        return
      }
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to update status')
        return
      }
      setStatus(newStatus)
      if (newStatus === 'busy' && busyMinutes) {
        setCurrentBusyUntil(new Date(Date.now() + busyMinutes * 60_000).toISOString())
      } else {
        setCurrentBusyUntil(null)
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleClick = (s: Status) => {
    if (s === 'busy') {
      setShowBusyModal(true)
    } else {
      changeStatus(s)
    }
  }

  const remaining = status === 'busy' ? formatBusyRemaining(currentBusyUntil) : null

  return (
    <>
      <div className={`rounded-2xl border-2 p-6 ${getStatusCardClass(status)}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-700">Current Status</h2>
          {remaining && (
            <span className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
              {remaining}
            </span>
          )}
        </div>

        <p className="text-3xl font-bold text-slate-900 mb-1">{getStatusLabel(status)}</p>

        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}

        <div className="grid grid-cols-3 gap-3 mt-5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.status}
              onClick={() => handleClick(opt.status)}
              disabled={loading}
              className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 font-medium transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                status === opt.status
                  ? `${opt.btn} ring-2 ring-offset-2 ring-slate-400 scale-[1.02]`
                  : `bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50`
              }`}
            >
              {opt.icon}
              <span className="text-sm">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {showBusyModal && (
        <BusyDurationModal
          onConfirm={(mins) => {
            setShowBusyModal(false)
            changeStatus('busy', mins)
          }}
          onCancel={() => setShowBusyModal(false)}
        />
      )}
    </>
  )
}
