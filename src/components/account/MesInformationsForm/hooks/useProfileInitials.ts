'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import type { InitialValues } from '../utils/types'

const EMPTY: InitialValues = {
  name: '',
  gender: '',
  country: '',
  experience: '',
  mainGoal: '',
  trainingPlace: '',
  weeklySessions: '',
  supplements: '',
  birthDate: '',
  avatar_url: '',
}

const DEBUG = true
const dlog  = (...a: any[]) => DEBUG && console.log('[useProfileInitials]', ...a)
const derr  = (...a: any[]) => DEBUG && console.error('[useProfileInitials]', ...a)

const storageKey = (userId: string) => `glift:profiles:${userId}`

function splitBirthDate(birth_date: string | null | undefined) {
  if (!birth_date) return { day: '', month: '', year: '' }
  const parts = String(birth_date).split('-')
  if (parts.length !== 3) return { day: '', month: '', year: '' }
  const [y, m, d] = parts
  return {
    day: (d ?? '').padStart(2, '0'),
    month: (m ?? '').padStart(2, '0'),
    year: y ?? '',
  }
}

export function useProfileInitials(user: any) {
  const supabase = createClient()

  const initialRef = useRef<InitialValues>(EMPTY)
  const [initialValues, setInitialValues] = useState<InitialValues>(EMPTY)

  const [initialBirthDay, setIBD] = useState<string>('')
  const [initialBirthMonth, setIBM] = useState<string>('')
  const [initialBirthYear, setIBY] = useState<string>('')

  const [ready, setReady] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!user?.id) {
        dlog('no user → ready')
        setReady(true)
        return
      }

      // 1) Hydratation via cache (évite le flash)
      try {
        const raw = sessionStorage.getItem(storageKey(user.id))
        if (raw) {
          const cached = JSON.parse(raw) as InitialValues
          const next: InitialValues = { ...EMPTY, ...cached }
          initialRef.current = next
          setInitialValues(next)
          const { day, month, year } = splitBirthDate(next.birthDate)
          setIBD(day); setIBM(month); setIBY(year)
          setReady(true)
          dlog('hydrated from cache')
        }
      } catch {
        // ignore
      }

      const applyAndCache = (next: InitialValues) => {
        initialRef.current = next
        setInitialValues(next)
        const { day, month, year } = splitBirthDate(next.birthDate)
        setIBD(day); setIBM(month); setIBY(year)
        try {
          sessionStorage.setItem(storageKey(user.id), JSON.stringify(next))
        } catch { /* ignore */ }
      }

      const mapRowToInitials = (r: any): InitialValues => ({
        name: r?.name ?? '',
        gender: r?.gender ?? '',
        country: r?.country ?? '',
        experience: r?.experience ?? '',
        mainGoal: r?.main_goal ?? '',
        trainingPlace: r?.training_place ?? '',
        weeklySessions: r?.weekly_sessions ?? '',
        supplements: r?.supplements ?? '',
        birthDate: r?.birth_date ?? '',
        // ⚠️ on ne SELECT pas avatar_url (la colonne n’existe pas chez toi)
        // on fallback sur l’auth metadata si dispo
        avatar_url: user?.user_metadata?.avatar_url ?? '',
      })

      const selectOnce = async () => {
        // ❌ NE PAS inclure 'avatar_url' ici → ta table ne l’a pas
        return supabase
          .from('profiles')
          .select(
            [
              'id',
              'name',
              'gender',
              'country',
              'experience',
              'main_goal',
              'training_place',
              'weekly_sessions',
              'supplements',
              'birth_date',
            ].join(', ')
          )
          .eq('id', user.id)
          .maybeSingle()
      }

      const handleRow = (row: any | null) => {
        if (!mounted) return
        if (!row) {
          setReady((was) => was || true)
          return
        }
        const next = mapRowToInitials(row)
        applyAndCache(next)
        setReady(true)
      }

      const { data: row, error } = await selectOnce()

      if (!mounted) return

      if (error) {
        const msg =
          (error as any)?.message ||
          (error as any)?.hint ||
          (error as any)?.details ||
          JSON.stringify(error) ||
          'Unknown select error'
        derr('select error:', msg)

        // Tentative: créer la ligne minimale (sans avatar_url) puis relire
        const { error: upErr } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              email: user.email ?? null,
              name: user.user_metadata?.name ?? null,
              // pas d’avatar_url ici
            },
            { onConflict: 'id' }
          )

        if (upErr) {
          const upMsg =
            (upErr as any)?.message || (upErr as any)?.hint || (upErr as any)?.details || JSON.stringify(upErr)
          derr('upsert after select error failed:', upMsg)
          setReady((was) => was || true)
          return
        }

        const retry = await selectOnce()
        if (retry.error) {
          const retryMsg =
            (retry.error as any)?.message || (retry.error as any)?.hint || (retry.error as any)?.details || JSON.stringify(retry.error)
          derr('retry select error:', retryMsg)
          setReady((was) => was || true)
          return
        }
        handleRow(retry.data)
        return
      }

      if (!row) {
        dlog('no profiles row → creating minimal row then reloading')
        const { error: upsertErr } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              email: user.email ?? null,
              name: user.user_metadata?.name ?? null,
            },
            { onConflict: 'id' }
          )

        if (upsertErr) {
          const msg =
            (upsertErr as any)?.message || (upsertErr as any)?.hint || (upsertErr as any)?.details || JSON.stringify(upsertErr)
          derr('upsert error:', msg)
          setReady((was) => was || true)
          return
        }

        const { data: row2, error: err2 } = await selectOnce()
        if (err2) {
          const msg =
            (err2 as any)?.message || (err2 as any)?.hint || (err2 as any)?.details || JSON.stringify(err2)
          derr('select after upsert error:', msg)
          setReady((was) => was || true)
          return
        }
        handleRow(row2)
        return
      }

      handleRow(row)
    })()

    return () => { mounted = false }
  }, [supabase, user?.id, user?.email, user?.user_metadata?.avatar_url])

  const initialBirthDate = useMemo(() => {
    if (!initialBirthDay || !initialBirthMonth || !initialBirthYear) return ''
    return `${initialBirthYear}-${initialBirthMonth}-${initialBirthDay}`
  }, [initialBirthDay, initialBirthMonth, initialBirthYear])

  const setInitials = (patch: Partial<InitialValues>) => {
    const merged: InitialValues = { ...initialRef.current, ...patch }
    initialRef.current = merged
    setInitialValues(merged)

    const anyPatch = patch as any
    if (typeof anyPatch.birthDate === 'string' && anyPatch.birthDate) {
      const { day, month, year } = splitBirthDate(anyPatch.birthDate)
      setIBD(day); setIBM(month); setIBY(year)
    }

    try {
      if (user?.id) sessionStorage.setItem(storageKey(user.id), JSON.stringify(merged))
    } catch { /* ignore */ }
  }

  return {
    initialRef,
    initialValues,
    setInitials,
    initialBirthDate,
    initialBirthDay,
    initialBirthMonth,
    initialBirthYear,
    ready,
  }
}

export default useProfileInitials
