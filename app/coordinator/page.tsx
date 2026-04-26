import { createClient } from '@/lib/supabase/server'
import OPCManager from '@/components/coordinator/OPCManager'
import ObjectiveForm from '@/components/coordinator/ObjectiveForm'
import { createObjective } from './actions'
import type { OperationCycle } from '@/lib/supabase/types'

export default async function CoordinatorPage() {
  const supabase = await createClient()

  const [cyclesRes, usersRes] = await Promise.all([
    supabase.from('operation_cycles').select('*').order('cycle_number', { ascending: false }),
    supabase.from('user_profiles').select('id, full_name').order('full_name'),
  ])

  const cycles = (cyclesRes.data ?? []) as OperationCycle[]
  const allUsers = (usersRes.data ?? []) as { id: string; full_name: string | null }[]
  const activeCycle = cycles.find((c) => c.is_active)

  // Fetch objectives for active cycle with all related data
  type KR = { id: string; description: string; progress: number }
  type ObjData = {
    id: string
    title: string
    owners: string[]
    custodians: string[]
    keyResults: KR[]
  }

  let objectives: ObjData[] = []

  if (activeCycle) {
    const { data: objRows } = await supabase
      .from('objectives')
      .select('id, title, key_results(id, description, progress), objective_owners(user_profile_id), objective_custodians(user_profile_id)')
      .eq('opc_id', activeCycle.id)
      .order('created_at')

    objectives = (objRows ?? []).map((obj) => ({
      id: obj.id,
      title: obj.title,
      owners: (obj.objective_owners as { user_profile_id: string }[]).map((o) => o.user_profile_id),
      custodians: (obj.objective_custodians as { user_profile_id: string }[]).map((c) => c.user_profile_id),
      keyResults: (obj.key_results as KR[]) ?? [],
    }))
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Coordinator Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage OPC cycles, objectives, and key results.</p>
      </div>

      <OPCManager cycles={cycles} />

      {activeCycle && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Objectives for OPC #{activeCycle.cycle_number}
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({activeCycle.start_date} → {activeCycle.end_date})
              </span>
            </h2>
            <a
              href="/tv"
              target="_blank"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Preview on TV →
            </a>
          </div>

          <div className="flex flex-col gap-3">
            {objectives.map((obj) => (
              <ObjectiveForm
                key={obj.id}
                {...obj}
                allUsers={allUsers}
              />
            ))}

            {/* Add objective form */}
            <form
              action={async (fd: FormData) => {
                'use server'
                const title = fd.get('title') as string
                if (activeCycle?.id && title?.trim()) {
                  await createObjective(activeCycle.id, title)
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                name="title"
                required
                maxLength={300}
                placeholder="Add new objective…"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-400 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 cursor-pointer"
              >
                + Add
              </button>
            </form>

            {objectives.length === 0 && (
              <p className="text-center text-slate-400 py-6 text-sm">
                No objectives yet. Add your first one above.
              </p>
            )}
          </div>
        </div>
      )}

      {!activeCycle && cycles.length > 0 && (
        <div className="text-center text-slate-400 py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-lg font-medium mb-2">No active OPC</p>
          <p className="text-sm">Activate a cycle above to manage its objectives.</p>
        </div>
      )}
    </div>
  )
}
