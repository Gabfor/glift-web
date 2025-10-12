'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

    const load = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('email_verified')
        .eq('id', user.id)
        .single()

      if (!error && data) setVerified(data.email_verified)
    }

    load()

    const channel = supabase
      .channel('email-verified')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          const next = (payload.new as any)?.email_verified
          if (typeof next === 'boolean') setVerified(next)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  return { verified }
}
