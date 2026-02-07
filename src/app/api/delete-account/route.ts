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

    // Cleanup Storage: Avatars
    // We attempt to clean up the user's avatar folder. 
    // We don't block deletion if this fails, but we log it.
    try {
      const bucketName = process.env.NEXT_PUBLIC_SUPABASE_AVATARS_BUCKET || 'avatars'
      const { data: files, error: listError } = await adminClient.storage
        .from(bucketName)
        .list(userId)

      if (listError) {
        console.error('[delete-account] failed to list avatar files', listError)
      } else if (files && files.length > 0) {
        const pathsToRemove = files.map((f) => `${userId}/${f.name}`)
        const { error: removeError } = await adminClient.storage
          .from(bucketName)
          .remove(pathsToRemove)

        if (removeError) {
          console.error('[delete-account] failed to remove avatar files', removeError)
        }
      }
    } catch (storageError) {
      console.error('[delete-account] unexpected storage cleanup error', storageError)
    }

    try {
      const { PaymentService } = await import('@/lib/services/paymentService')
      const paymentService = new PaymentService(adminClient)
      await paymentService.deleteCustomer(user.id, user.email || '', user.app_metadata)
    } catch (paymentError) {
      console.error('[delete-account] failed to delete stripe customer', paymentError)
      // We log but do not block account deletion if stripe fails? 
      // User requested deletion, so we should proceed with local deletion even if Stripe fails, 
      // but maybe strictness depends on requirements. 
      // Proceeding ensures the user account is deleted as requested.
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
