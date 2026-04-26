'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sanitizeText } from '@/lib/utils'

const ADHAN_BUCKET = 'adhan-sounds'
const ADHAN_MAX_BYTES = 10 * 1024 * 1024 // 10MB
const ADHAN_ALLOWED_MIMES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/x-m4a', 'audio/mp4']

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

// ─── Adhan sound management ───────────────────────────────────────────────────

export async function uploadAdhanSound(_prev: unknown, formData: FormData) {
  const adminId = await getAdminUserId()
  const supabase = await createClient()

  const file = formData.get('file') as File | null
  const rawName = (formData.get('name') as string) ?? ''
  const name = sanitizeText(rawName, 60)

  if (!file || !file.size) return { error: 'No file selected' }
  if (!name) return { error: 'Name is required' }
  if (file.size > ADHAN_MAX_BYTES) return { error: 'File too large (max 10MB)' }
  if (!ADHAN_ALLOWED_MIMES.includes(file.type)) return { error: 'Audio format not supported' }

  const ext = (file.name.split('.').pop() ?? 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'mp3'
  const path = `${adminId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadErr } = await supabase
    .storage
    .from(ADHAN_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadErr) return { error: `Upload failed: ${uploadErr.message}` }

  const { count } = await supabase
    .from('adhan_sounds')
    .select('id', { count: 'exact', head: true })

  const { error: insertErr } = await supabase
    .from('adhan_sounds')
    .insert({
      name,
      storage_path: path,
      uploaded_by: adminId,
      is_default: (count ?? 0) === 0,
    })

  if (insertErr) {
    await supabase.storage.from(ADHAN_BUCKET).remove([path])
    return { error: insertErr.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function setDefaultAdhanSound(soundId: string) {
  await getAdminUserId()
  const supabase = await createClient()

  const { error: clearErr } = await supabase
    .from('adhan_sounds')
    .update({ is_default: false })
    .eq('is_default', true)

  if (clearErr) return { error: clearErr.message }

  const { error } = await supabase
    .from('adhan_sounds')
    .update({ is_default: true })
    .eq('id', soundId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteAdhanSound(soundId: string) {
  await getAdminUserId()
  const supabase = await createClient()

  const { data: sound, error: fetchErr } = await supabase
    .from('adhan_sounds')
    .select('storage_path, is_default')
    .eq('id', soundId)
    .maybeSingle()

  if (fetchErr) return { error: fetchErr.message }
  if (!sound) return { error: 'Sound not found' }

  const { error: deleteErr } = await supabase
    .from('adhan_sounds')
    .delete()
    .eq('id', soundId)

  if (deleteErr) return { error: deleteErr.message }

  await supabase.storage.from(ADHAN_BUCKET).remove([sound.storage_path])

  if (sound.is_default) {
    const { data: next } = await supabase
      .from('adhan_sounds')
      .select('id')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (next?.id) {
      await supabase.from('adhan_sounds').update({ is_default: true }).eq('id', next.id)
    }
  }

  revalidatePath('/admin')
  return { success: true }
}
