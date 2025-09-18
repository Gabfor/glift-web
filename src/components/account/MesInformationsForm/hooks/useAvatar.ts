'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_AVATAR === '1' || true
const dlog  = (...a: any[]) => DEBUG && console.log('[useAvatar]', ...a)
const dwarn = (...a: any[]) => DEBUG && console.warn('[useAvatar]', ...a)
const derr  = (...a: any[]) => DEBUG && console.error('[useAvatar]', ...a)

type UploadDone = (info: { url: string; filename: string; objectPath: string }) => void

const BUCKET = 'avatars'

const extFromFile = (f: File) => {
  const nameExt = (f.name.split('.').pop() || '').toLowerCase()
  if (nameExt) return nameExt
  if (/png$/i.test(f.type))  return 'png'
  if (/jpe?g$/i.test(f.type)) return 'jpg'
  if (/webp$/i.test(f.type)) return 'webp'
  if (/avif$/i.test(f.type)) return 'avif'
  return 'jpg'
}

/**
 * Ultra simple, sans metadata:
 * - UPLOAD : supprime d'abord tout le dossier avatars/{user.id}/, puis uploade sous un nom unique (timestamp.ext),
 *            et émet l'URL publique pour affichage immédiat (formulaire + header).
 * - REMOVE : supprime tout le dossier avatars/{user.id}/, puis émet null.
 */
export function useAvatar(_user: any, initialUrl: string) {
  const supabase = createClient()
  const [profileImageUrl, setProfileImageUrl] = useState<string>(initialUrl || '')

  const emit = (url: string | null) => {
    try { window.dispatchEvent(new CustomEvent('glift:avatar-updated', { detail: { url } })) } catch {}
  }

  const clearFolder = async (userId: string) => {
    const { data: files, error: listErr } = await supabase.storage.from(BUCKET).list(userId, { limit: 1000 })
    if (listErr) { dwarn('list warn:', listErr); return }
    if (!files || !files.length) return
    const paths = files.map(f => `${userId}/${f.name}`)
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove(paths)
    if (rmErr) dwarn('remove warn:', rmErr)
  }

  // ---------- UPLOAD ----------
  const uploadAvatar = async (file: File, onDone?: UploadDone) => {
    dlog('upload START', { name: file.name, size: file.size, type: file.type })

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) { derr('no auth user:', authErr); return }

    // 1) Nettoyage du dossier pour éviter tout cache au même chemin
    await clearFolder(user.id)

    // 2) Upload sous un nom unique (timestamp)
    const ext = extFromFile(file)
    const filename = `${Date.now()}.${ext}`
    const objectPath = `${user.id}/${filename}`

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectPath, file, { upsert: false })
    if (upErr) { derr('storage upload error:', upErr); return }

    // 3) URL publique simple
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
    const publicUrl = pub.publicUrl

    // 4) UI immédiate + notifie le Header
    setProfileImageUrl(publicUrl)
    emit(publicUrl)

    onDone?.({ url: publicUrl, filename, objectPath })
    dlog('upload END')
  }

  // ---------- REMOVE ----------
  const removeAvatar = async (onDone?: () => void) => {
    dlog('remove START', { current: profileImageUrl })

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) { derr('no auth user:', authErr); onDone?.(); return }

    await clearFolder(user.id)

    setProfileImageUrl('')
    emit(null)

    dlog('remove END')
    onDone?.()
  }

  return { profileImageUrl, setProfileImageUrl, uploadAvatar, removeAvatar }
}

export default useAvatar
