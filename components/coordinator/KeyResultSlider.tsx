'use client'

import { useState } from 'react'
import { Check, Trash2, Edit2, X } from 'lucide-react'
import { updateKeyResult, deleteKeyResult } from '@/app/coordinator/actions'

interface Props {
  id: string
  description: string
  progress: number
}

function krColor(pct: number): string {
  if (pct >= 80) return '#16a34a'
  if (pct >= 50) return '#2563eb'
  return '#f97316'
}

export default function KeyResultSlider({ id, description: initialDesc, progress: initialProgress }: Props) {
  const [desc, setDesc]         = useState(initialDesc)
  const [progress, setProgress] = useState(initialProgress)
  const [input, setInput]       = useState(String(initialProgress))
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)

  const save = async () => {
    const clamped = Math.min(100, Math.max(0, parseInt(input) || 0))
    setProgress(clamped)
    setInput(String(clamped))
    setSaving(true)
    await updateKeyResult(id, desc, clamped)
    setSaving(false)
    setEditing(false)
  }

  const handleInputChange = (val: string) => {
    setInput(val)
    const n = parseInt(val)
    if (!isNaN(n)) setProgress(Math.min(100, Math.max(0, n)))
  }

  const remove = async () => {
    if (!confirm('Delete this key result?')) return
    await deleteKeyResult(id)
  }

  const color = krColor(progress)

  return (
    <div className="p-3 bg-white border border-slate-200 rounded-xl">
      {editing ? (
        <div className="flex flex-col gap-3">
          {/* Description */}
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={500}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Key result description…"
          />

          {/* Progress input + live bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: color }}
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min={0}
                max={100}
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={() => {
                  const n = Math.min(100, Math.max(0, parseInt(input) || 0))
                  setInput(String(n))
                  setProgress(n)
                }}
                className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-base font-bold text-center focus:outline-none focus:border-blue-400"
                style={{ color }}
              />
              <span className="text-base font-bold text-slate-500">%</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setEditing(false); setProgress(initialProgress); setInput(String(initialProgress)) }}
              className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 truncate">{desc}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: color }}
                />
              </div>
              <span
                className="text-sm font-bold tabular-nums w-10 text-right"
                style={{ color }}
              >
                {progress}%
              </span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={remove}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
