import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/types'

const COMPANY_DOMAIN = process.env.NEXT_PUBLIC_COMPANY_DOMAIN ?? 'getrime.com'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
  }

  const email = data.user.email ?? ''

  if (!email.toLowerCase().endsWith(`@${COMPANY_DOMAIN}`)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/auth/login?error=domain_not_allowed`)
  }

  // Auto-create profile on first login
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!existing) {
    const meta = data.user.user_metadata ?? {}
    await supabase.from('user_profiles').insert({
      id: data.user.id,
      email,
      full_name: (meta.full_name ?? meta.name ?? null) as string | null,
      avatar_url: (meta.avatar_url ?? meta.picture ?? null) as string | null,
      role: 'employee',
      status: 'available',
    })
  }

  const safeNext = next.startsWith('/') ? next : '/dashboard'
  return NextResponse.redirect(`${origin}${safeNext}`)
}
