'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Check } from 'lucide-react'

interface Props {
  currentNote: string | null
}

export default function NoteEditor({ currentNote }: Props) {
  const router = useRouter()
  const [note, setNote] = useState(currentNote ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    const res = await fetch('/api/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const maxLen = 100
  const remaining = maxLen - note.length

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-slate-500" />
        <h2 className="text-lg font-semibold text-slate-700">Status Note</h2>
      </div>

      <p className="text-sm text-slate-500 mb-3">
        This appears in the office TV ticker. Keep it brief and professional.
      </p>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, maxLen))}
        placeholder='e.g. "In client meeting room B" or "WFH today"'
        rows={2}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 resize-none focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
      />

      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs ${remaining <= 10 ? 'text-amber-500' : 'text-slate-400'}`}>
          {remaining} characters left
        </span>
        <div className="flex items-center gap-3">
          {note && (
            <div className="text-xs text-slate-400 italic">
              Preview: &ldquo;{note}&rdquo;
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
