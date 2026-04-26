import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EmployeeGrid from '@/components/admin/EmployeeGrid'
import AnnouncementManager from '@/components/admin/AnnouncementManager'
import { updateCompanySettings } from './actions'
import type { UserProfile } from '@/lib/supabase/types'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [employeesRes, settingsRes] = await Promise.all([
    supabase.from('user_profiles').select('*').order('full_name'),
    supabase.from('site_settings').select('*').eq('id', 'global_config').maybeSingle(),
  ])

  const employees = (employeesRes.data ?? []) as UserProfile[]
  const settings = settingsRes.data

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage employees, roles, and announcements.</p>
      </div>

      {/* Announcement */}
      <AnnouncementManager settings={settings} />

      {/* Company settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Company Settings</h2>
        <form
          action={async (fd: FormData) => {
            'use server'
            await updateCompanySettings(null, fd)
          }}
          className="flex flex-col gap-4 max-w-md"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
            <input
              type="text"
              name="company_name"
              defaultValue={settings?.company_name ?? ''}
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 text-sm"
              placeholder="Rime"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              News Ticker Tagline <span className="text-slate-400 font-normal">(shown when no notes)</span>
            </label>
            <input
              type="text"
              name="tagline"
              defaultValue={settings?.tagline ?? ''}
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 text-sm"
              placeholder="Building the future together"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Save settings
            </button>
          </div>
        </form>
      </div>

      {/* Employee grid */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Employees <span className="text-slate-400 font-normal text-base">({employees.length})</span>
        </h2>
        <EmployeeGrid employees={employees} currentUserId={user.id} />
      </div>
    </div>
  )
}
