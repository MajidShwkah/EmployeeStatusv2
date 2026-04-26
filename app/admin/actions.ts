'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sanitizeText } from '@/lib/utils'

async function getAdminUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: rows } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .limit(1)

  const role = (rows as Array<{ role: string | null }> | null)?.[0]?.role
  if (role !== 'admin') throw new Error('Forbidden')
  return user.id
}

export async function overrideStatus(
  targetUserId: string,
  status: 'available' | 'busy' | 'important',
  busyMinutes?: number
) {
  await getAdminUserId()
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_profiles')
    .update({
      status,
      busy_until:
        status === 'busy' && busyMinutes
          ? new Date(Date.now() + busyMinutes * 60_000).toISOString()
          : null,
    })
    .eq('id', targetUserId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateEmployeeRole(
  targetUserId: string,
  role: 'admin' | 'employee' | 'coordinator'
) {
  const adminId = await getAdminUserId()
  const supabase = await createClient()

  if (targetUserId === adminId && role !== 'admin') {
    const { count } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
    if ((count ?? 0) <= 1) return { error: 'Cannot demote the only admin' }
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('id', targetUserId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateAnnouncement(_prev: unknown, formData: FormData) {
  await getAdminUserId()
  const supabase = await createClient()

  const text = sanitizeText((formData.get('announcement_text') as string) ?? '', 300)
  const isActive = formData.get('is_active') === 'on'
  const expiryStr = formData.get('announcement_expiry') as string

  const { error } = await supabase
    .from('site_settings')
    .update({
      announcement_text: text || null,
      is_active: isActive,
      announcement_expiry: expiryStr ? new Date(expiryStr).toISOString() : null,
    })
    .eq('id', 'global_config')

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateCompanySettings(_prev: unknown, formData: FormData) {
  await getAdminUserId()
  const supabase = await createClient()

  const { error } = await supabase
    .from('site_settings')
    .update({
      company_name: sanitizeText((formData.get('company_name') as string) ?? '', 100) || null,
      tagline: sanitizeText((formData.get('tagline') as string) ?? '', 200) || null,
    })
    .eq('id', 'global_config')

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}
