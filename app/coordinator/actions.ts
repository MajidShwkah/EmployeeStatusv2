'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sanitizeText } from '@/lib/utils'

async function assertCoordinator(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: rows } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .limit(1)

  const role = (rows as Array<{ role: string | null }> | null)?.[0]?.role
  if (!role || !['coordinator', 'admin'].includes(role)) throw new Error('Forbidden')
}

// ─── OPC ──────────────────────────────────────────────────────────────────────

export async function createCycle(_prev: unknown, formData: FormData) {
  await assertCoordinator()
  const supabase = await createClient()

  const cycleNumber = parseInt(formData.get('cycle_number') as string)
  const startDate = formData.get('start_date') as string
  const endDate = formData.get('end_date') as string

  if (isNaN(cycleNumber) || !startDate || !endDate) return { error: 'All fields required' }

  const { error } = await supabase.from('operation_cycles').insert({
    cycle_number: cycleNumber,
    start_date: startDate,
    end_date: endDate,
    is_active: false,
  })

  if (error) return { error: error.message }
  revalidatePath('/coordinator')
  return { success: true }
}

export async function toggleCycleActive(cycleId: string, activate: boolean) {
  await assertCoordinator()
  const supabase = await createClient()

  if (activate) {
    await supabase.from('operation_cycles').update({ is_active: false }).neq('id', cycleId)
  }

  const { error } = await supabase
    .from('operation_cycles')
    .update({ is_active: activate })
    .eq('id', cycleId)

  if (error) return { error: error.message }
  revalidatePath('/coordinator')
  return { success: true }
}

export async function deleteCycle(cycleId: string) {
  await assertCoordinator()
  const supabase = await createClient()
  const { error } = await supabase.from('operation_cycles').delete().eq('id', cycleId)
  if (error) return { error: error.message }
  revalidatePath('/coordinator')
  return { success: true }
}

// ─── Objectives ───────────────────────────────────────────────────────────────

export async function createObjective(opcId: string, title: string) {
  await assertCoordinator()
  const supabase = await createClient()
  const clean = sanitizeText(title, 300)
  if (!clean) return { error: 'Title required' }

  const { data, error } = await supabase
    .from('objectives')
    .insert({ opc_id: opcId, title: clean })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/coordinator')
  return { success: true, id: data.id }
}

export async function updateObjective(objectiveId: string, title: string) {
  await assertCoordinator()
  const supabase = await createClient()
  const { error } = await supabase
    .from('objectives')
    .update({ title: sanitizeText(title, 300) })
    .eq('id', objectiveId)

  if (error) return { error: error.message }
  revalidatePath('/coordinator')
  return { success: true }
}

export async function deleteObjective(objectiveId: string) {
  await assertCoordinator()
  const supabase = await createClient()
  const { error } = await supabase.from('objectives').delete().eq('id', objectiveId)
  if (error) return { error: error.message }
  revalidatePath('/coordinator')
  return { success: true }
}

export async function setObjectiveOwners(objectiveId: string, userIds: string[]) {
  await assertCoordinator()
  const supabase = await createClient()
  await supabase.from('objective_owners').delete().eq('objective_id', objectiveId)
  if (userIds.length) {
    await supabase.from('objective_owners').insert(
      userIds.map((uid) => ({ objective_id: objectiveId, user_profile_id: uid }))
    )
  }
  revalidatePath('/coordinator')
  return { success: true }
}

export async function setObjectiveCustodians(objectiveId: string, userIds: string[]) {
  await assertCoordinator()
  const supabase = await createClient()
  await supabase.from('objective_custodians').delete().eq('objective_id', objectiveId)
  if (userIds.length) {
    await supabase.from('objective_custodians').insert(
      userIds.map((uid) => ({ objective_id: objectiveId, user_profile_id: uid }))
    )
  }
  revalidatePath('/coordinator')
  return { success: true }
}

// ─── Key Results ──────────────────────────────────────────────────────────────

export async function createKeyResult(objectiveId: string, description: string) {
  await assertCoordinator()
  const supabase = await createClient()
  const clean = sanitizeText(description, 500)
  if (!clean) return { error: 'Description required' }

  const { error } = await supabase.from('key_results').insert({
    objective_id: objectiveId,
    description: clean,
    progress: 0,
  })

  if (error) return { error: error.message }
  revalidatePath('/coordinator')
  return { success: true }
}

export async function updateKeyResult(krId: string, description: string, progress: number) {
  await assertCoordinator()
  const supabase = await createClient()
  const { error } = await supabase
    .from('key_results')
    .update({
      description: sanitizeText(description, 500),
      progress: Math.min(100, Math.max(0, Math.round(progress))),
    })
    .eq('id', krId)

  if (error) return { error: error.message }
  revalidatePath('/coordinator')
  return { success: true }
}

export async function deleteKeyResult(krId: string) {
  await assertCoordinator()
  const supabase = await createClient()
  const { error } = await supabase.from('key_results').delete().eq('id', krId)
  if (error) return { error: error.message }
  revalidatePath('/coordinator')
  return { success: true }
}
