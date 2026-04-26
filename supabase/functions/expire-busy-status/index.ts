// Supabase Edge Function — HTTP-triggered alternative to pg_cron
// Deploy: supabase functions deploy expire-busy-status
// Call via cron or scheduled webhook every minute

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Verify internal call (optional bearer secret)
  const authHeader = req.headers.get('Authorization')
  const expected = Deno.env.get('CRON_SECRET')
  if (expected && authHeader !== `Bearer ${expected}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      status: 'available',
      busy_until: null,
    })
    .eq('status', 'busy')
    .lt('busy_until', new Date().toISOString())
    .select('id, full_name')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({ expired: data?.length ?? 0, users: data?.map((u) => u.full_name) }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
