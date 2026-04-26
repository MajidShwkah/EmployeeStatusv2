import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/shared/DashboardNav'

export default async function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .single()

  if (!['coordinator', 'admin'].includes(profile?.role ?? '')) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav profile={profile} />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
