'use client'

import { useActionState, useState } from 'react'
import { Megaphone, ToggleLeft, ToggleRight } from 'lucide-react'
import { updateAnnouncement } from '@/app/admin/actions'
import type { SiteSettings } from '@/lib/supabase/types'

interface Props {
  settings: SiteSettings | null
}

export default function AnnouncementManager({ settings }: Props) {
  const [state, action, pending] = useActionState(updateAnnouncement, null)
  const [isActive, setIsActive] = useState(settings?.is_active ?? false)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-700">Announcement Banner</h2>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <form action={action} className="flex flex-col gap-4">
        <textarea
          name="announcement_text"
          defaultValue={settings?.announcement_text ?? ''}
          placeholder="Enter announcement text…"
          rows={3}
          maxLength={300}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 resize-none focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
        />

        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className="cursor-pointer"
            >
              {isActive ? (
                <ToggleRight className="w-8 h-8 text-blue-600" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-400" />
              )}
            </button>
            <span className="text-sm text-slate-600">Show on TV</span>
            {/* Hidden checkbox for form submission */}
            <input type="hidden" name="is_active" value={isActive ? 'on' : 'off'} />
          </label>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 shrink-0">Expires at:</label>
            <input
              type="datetime-local"
              name="announcement_expiry"
              defaultValue={settings?.announcement_expiry
                ? new Date(settings.announcement_expiry).toISOString().slice(0, 16)
                : ''}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-green-600">✓ Announcement updated</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {pending ? 'Saving…' : 'Save announcement'}
          </button>
        </div>
      </form>
    </div>
  )
}
