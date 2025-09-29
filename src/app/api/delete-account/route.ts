import { NextResponse } from 'next/server'

import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('[delete-account] unable to retrieve user', userError)
      return NextResponse.json({ error: 'user-fetch-failed' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'not-authenticated' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const userId = user.id

    const tables: Array<'user_subscriptions' | 'training_rows' | 'trainings' | 'programs'> = [
      'user_subscriptions',
      'training_rows',
      'trainings',
      'programs',
    ]

    for (const table of tables) {
      const { error } = await adminClient.from(table).delete().eq('user_id', userId)
      if (error) {
        console.error(`[delete-account] failed to clean table ${table}`, error)
        throw new Error(`cleanup-${table}`)
      }
    }

    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      console.error('[delete-account] sign out failed', signOutError)
    }

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteUserError) {
      console.error('[delete-account] failed to delete auth user', deleteUserError)
      throw new Error('delete-user')
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('[delete-account] unexpected error', error)
    const message = error instanceof Error ? error.message : undefined
    return NextResponse.json(
      { error: message || 'delete-account-failed' },
      { status: 500 }
    )
  }
}
