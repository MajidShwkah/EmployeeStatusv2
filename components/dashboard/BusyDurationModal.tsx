'use client'

import { useState } from 'react'
import { X, Clock } from 'lucide-react'

const PRESETS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
]

const MAX_MINUTES = 180

interface Props {
  onConfirm: (minutes: number) => void
  onCancel: () => void
}

export default function BusyDurationModal({ onConfirm, onCancel }: Props) {
  const [customMinutes, setCustomMinutes] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const handleCustomSubmit = () => {
    const mins = parseInt(customMinutes)
    if (!isNaN(mins) && mins >= 1 && mins <= MAX_MINUTES) {
      onConfirm(mins)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold text-slate-900">How long will you be busy?</h2>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => onConfirm(p.value)}
              className="px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-medium hover:border-red-400 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer text-sm"
            >
              {p.label}
            </button>
          ))}
        </div>

        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm hover:border-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            Custom duration…
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={MAX_MINUTES}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              placeholder="1–180 minutes"
              className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-900 focus:border-red-400 focus:outline-none text-sm"
              autoFocus
            />
            <button
              onClick={handleCustomSubmit}
              disabled={!customMinutes || parseInt(customMinutes) < 1 || parseInt(customMinutes) > MAX_MINUTES}
              className="px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              Set
            </button>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-3 text-center">Maximum 3 hours · Auto-resets to Available when time expires</p>
      </div>
    </div>
  )
}
