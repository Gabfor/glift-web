import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { access_token, refresh_token } = await req.json().catch(() => ({}))
  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: 'bad-request' }, { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies })
  const { error } = await supabase.auth.setSession({ access_token, refresh_token })
  if (error) return NextResponse.json({ error: error.message }, { status: 401 })

  return NextResponse.json({ ok: true })
}
