import { createClient } from '@/lib/supabase/server'
import { fetchPrayerTimes } from '@/lib/prayer'
import TVBoard from '@/components/tv/TVBoard'
import type { AiSafeUserProfile, SiteSettings } from '@/lib/supabase/types'
import type { OpcData, ObjectiveWithDetails } from '@/components/tv/OPCCarousel'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TVPage() {
  const supabase = await createClient()

  const [employeesRes, cycleRes, settingsRes, prayerRes, adhanRes] = await Promise.allSettled([
    supabase
      .from('ai_safe_user_profiles')
      .select('*')
      .order('full_name'),
    supabase
      .from('operation_cycles')
      .select('id, cycle_number, start_date, end_date')
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'global_config')
      .maybeSingle(),
    fetchPrayerTimes(),
    supabase
      .from('adhan_sounds')
      .select('storage_path')
      .eq('is_default', true)
      .maybeSingle(),
  ])

  const employees =
    employeesRes.status === 'fulfilled' ? (employeesRes.value.data ?? []) : []
  const cycle =
    cycleRes.status === 'fulfilled' ? cycleRes.value.data : null
  const settings =
    settingsRes.status === 'fulfilled' ? settingsRes.value.data : null
  const prayerTimes =
    prayerRes.status === 'fulfilled' ? prayerRes.value : null
  const defaultAdhanPath =
    adhanRes.status === 'fulfilled' ? adhanRes.value.data?.storage_path ?? null : null
  const initialAdhanUrl = defaultAdhanPath
    ? supabase.storage.from('adhan-sounds').getPublicUrl(defaultAdhanPath).data.publicUrl
    : null

  let opcData: OpcData | null = null

  if (cycle?.id) {
    const { data: objectivesRaw } = await supabase
      .from('objectives')
      .select(
        'id, title, key_results(id, description, progress), objective_owners(user_profile_id), objective_custodians(user_profile_id)'
      )
      .eq('opc_id', cycle.id)

    if (objectivesRaw?.length) {
      type OwnerRow = { user_profile_id: string }
      type KrRow = { id: string; description: string; progress: number }
      type ObjRaw = {
        id: string
        title: string
        key_results: KrRow[]
        objective_owners: OwnerRow[]
        objective_custodians: OwnerRow[]
      }

      const rows = objectivesRaw as unknown as ObjRaw[]

      const allUserIds = [
        ...rows.flatMap((o) => o.objective_owners.map((r) => r.user_profile_id)),
        ...rows.flatMap((o) => o.objective_custodians.map((r) => r.user_profile_id)),
      ]
      const uniqueIds = [...new Set(allUserIds)]

      const { data: profiles } = uniqueIds.length
        ? await supabase
            .from('user_profiles')
            .select('id, full_name, avatar_url')
            .in('id', uniqueIds)
        : { data: [] }

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

      opcData = {
        id: cycle.id,
        cycleNumber: cycle.cycle_number,
        startDate: cycle.start_date,
        endDate: cycle.end_date,
        objectives: rows.map(
          (obj): ObjectiveWithDetails => ({
            id: obj.id,
            title: obj.title,
            owners: obj.objective_owners.map((o) => {
              const p = profileMap.get(o.user_profile_id)
              return { id: o.user_profile_id, full_name: p?.full_name ?? null, avatar_url: p?.avatar_url ?? null }
            }),
            custodians: obj.objective_custodians.map((c) => {
              const p = profileMap.get(c.user_profile_id)
              return { id: c.user_profile_id, full_name: p?.full_name ?? null, avatar_url: p?.avatar_url ?? null }
            }),
            keyResults: obj.key_results.map((kr) => ({
              id: kr.id,
              description: kr.description,
              progress: kr.progress,
            })),
          })
        ),
      }
    }
  }

  return (
    <TVBoard
      initialEmployees={employees as AiSafeUserProfile[]}
      initialOpc={opcData}
      initialSettings={settings as SiteSettings | null}
      initialPrayerTimes={prayerTimes}
      initialAdhanUrl={initialAdhanUrl}
    />
  )
}
