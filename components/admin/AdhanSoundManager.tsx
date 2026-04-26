'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { CheckCircle2, Pause, Play, Trash2, Upload, Volume2 } from 'lucide-react'
import { uploadAdhanSound, setDefaultAdhanSound, deleteAdhanSound } from '@/app/admin/actions'

export interface AdhanSoundRow {
  id: string
  name: string
  is_default: boolean
  uploaded_at: string
  url: string
}

interface Props {
  sounds: AdhanSoundRow[]
}

const initialState: { error?: string; success?: boolean } = {}

export default function AdhanSoundManager({ sounds }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [actionMsg, setActionMsg] = useState<string>('')
  const [uploadState, uploadAction] = useActionState(uploadAdhanSound, initialState)

  useEffect(() => {
    if (uploadState?.success) {
      formRef.current?.reset()
      setActionMsg('Uploaded ✓')
      const t = setTimeout(() => setActionMsg(''), 2500)
      return () => clearTimeout(t)
    }
    if (uploadState?.error) {
      setActionMsg(uploadState.error)
      const t = setTimeout(() => setActionMsg(''), 4000)
      return () => clearTimeout(t)
    }
  }, [uploadState])

  useEffect(() => () => { audioRef.current?.pause() }, [])

  function togglePreview(s: AdhanSoundRow) {
    if (playingId === s.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    audioRef.current?.pause()
    const a = new Audio(s.url)
    audioRef.current = a
    a.onended = () => setPlayingId(null)
    a.play().then(() => setPlayingId(s.id)).catch(() => setPlayingId(null))
  }

  async function makeDefault(id: string) {
    startTransition(async () => {
      const res = await setDefaultAdhanSound(id)
      if (res?.error) setActionMsg(res.error)
      else setActionMsg('Default updated ✓')
      setTimeout(() => setActionMsg(''), 2500)
    })
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    startTransition(async () => {
      if (playingId === id) { audioRef.current?.pause(); setPlayingId(null) }
      const res = await deleteAdhanSound(id)
      if (res?.error) setActionMsg(res.error)
      else setActionMsg('Deleted ✓')
      setTimeout(() => setActionMsg(''), 2500)
    })
  }

  const hasDefault = sounds.some((s) => s.is_default)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Volume2 className="w-5 h-5 text-emerald-600" />
        <h2 className="text-lg font-semibold text-slate-700">Adhan Sounds</h2>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        Upload prayer call sounds. The default sound plays on the TV at every adhan time.
      </p>

      {/* Upload form */}
      <form ref={formRef} action={uploadAction} className="flex flex-col gap-3 mb-5 pb-5 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            name="name"
            required
            maxLength={60}
            placeholder="Sound name (e.g. Makkah Adhan)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-400 text-sm"
          />
          <input
            type="file"
            name="file"
            required
            accept="audio/*"
            className="flex-1 text-sm text-slate-700 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-medium hover:file:bg-emerald-100 file:cursor-pointer cursor-pointer"
          />
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>
        <p className="text-xs text-slate-400">MP3, WAV, OGG, M4A · Max 10MB</p>
      </form>

      {/* Status pill */}
      {actionMsg && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
          {actionMsg}
        </div>
      )}

      {/* Sound list */}
      {sounds.length === 0 ? (
        <p className="text-sm text-slate-400 italic text-center py-6">
          No adhan sounds uploaded yet. Upload one above to enable TV adhan playback.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {!hasDefault && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 mb-1">
              ⚠ No default selected — TV will not play any adhan. Pick one below.
            </div>
          )}
          {sounds.map((s) => (
            <div
              key={s.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                s.is_default
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <button
                type="button"
                onClick={() => togglePreview(s)}
                className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-700 cursor-pointer shrink-0"
                title="Preview"
              >
                {playingId === s.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{s.name}</p>
                <p className="text-xs text-slate-400">
                  Uploaded {new Date(s.uploaded_at).toLocaleDateString()}
                </p>
              </div>

              {s.is_default ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Default
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeDefault(s.id)}
                  disabled={pending}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  Set as default
                </button>
              )}

              <button
                type="button"
                onClick={() => remove(s.id, s.name)}
                disabled={pending}
                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center hover:border-red-300 hover:text-red-600 disabled:opacity-50 cursor-pointer shrink-0"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
