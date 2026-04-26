import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatusSwitcher from '@/components/dashboard/StatusSwitcher'
import NoteEditor from '@/components/dashboard/NoteEditor'
import ProfileSettings from '@/components/dashboard/ProfileSettings'
import MyObjectives from '@/components/dashboard/MyObjectives'
import type { Status } from '@/lib/supabase/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  // Fetch active OPC objectives where user is owner or custodian
  const { data: activeOpc } = await supabase
    .from('operation_cycles')
    .select('id, cycle_number')
    .eq('is_active', true)
    .maybeSingle()

  type ObjItem = {
    id: string
    title: string
    cycle_number: number
    role: 'owner' | 'custodian'
    key_results: { id: string; description: string; progress: number }[]
  }

  const myObjectives: ObjItem[] = []

  if (activeOpc?.id) {
    const { data: ownerRows } = await supabase
      .from('objective_owners')
      .select('objective_id')
      .eq('user_profile_id', user.id)

    const { data: custodianRows } = await supabase
      .from('objective_custodians')
      .select('objective_id')
      .eq('user_profile_id', user.id)

    const ownerIds = (ownerRows ?? []).map((r) => r.objective_id)
    const custodianIds = (custodianRows ?? []).map((r) => r.objective_id)
    const allIds = [...new Set([...ownerIds, ...custodianIds])]

    if (allIds.length) {
      const { data: objs } = await supabase
        .from('objectives')
        .select('id, title, key_results(id, description, progress)')
        .in('id', allIds)
        .eq('opc_id', activeOpc.id)

      ;(objs ?? []).forEach((obj) => {
        myObjectives.push({
          id: obj.id,
          title: obj.title,
          cycle_number: activeOpc.cycle_number,
          role: ownerIds.includes(obj.id) ? 'owner' : 'custodian',
          key_results: (obj.key_results as { id: string; description: string; progress: number }[]) ?? [],
        })
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Good to see you, {profile.full_name?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-slate-500 mt-1">Update your status so your team knows your availability.</p>
      </div>

      <StatusSwitcher
        currentStatus={(profile.status as Status) ?? 'available'}
        busyUntil={profile.busy_until}
      />

      <NoteEditor currentNote={profile.status_note} />

      <ProfileSettings
        userId={user.id}
        fullName={profile.full_name}
        avatarUrl={profile.avatar_url}
      />

      <MyObjectives objectives={myObjectives} />
    </div>
  )
}
