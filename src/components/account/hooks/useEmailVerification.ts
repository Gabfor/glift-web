'use client'

import { useEffect, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabaseClient'
import { useUser } from '@/context/UserContext'

export function useEmailVerification() {
  const supabase = createClient()
  const { user } = useUser()
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) {
      setVerified(null)
      return
    }

    setVerified(Boolean(user.email_confirmed_at))

    const load = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('email_verified')
        .eq('id', user.id)
        .maybeSingle()

      if (!error && data && 'email_verified' in data) {
        const next = data.email_verified
        if (typeof next === 'boolean') setVerified(next)
      }
    }

    void load()

    const channel = supabase
      .channel('email-verified')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload: RealtimePostgresChangesPayload<{ email_verified: boolean | null }>) => {
          const record = payload.new
          if (record && 'email_verified' in record) {
            const next = record.email_verified
            if (typeof next === 'boolean') setVerified(next)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  return { verified }
}
