import { InitialValues, FormSlices } from './types'
import { buildBirthDate } from './buildBirthDate'

/** Supprime seulement le paramètre de cache-buster `v` et ignore les blobs pour ne pas fausser l’égalité */
function normalizeAvatar(url: string | null | undefined) {
  const u = (url || '').trim()
  if (!u) return ''
  if (u.startsWith('blob:')) return 'blob:' // on considère juste “il y a un blob” vs pas de blob
  try {
    const obj = new URL(u, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    // retire UNIQUEMENT le paramètre v (cache-buster)
    obj.searchParams.delete('v')
    return obj.origin + obj.pathname + (obj.search ? `?${obj.searchParams.toString()}` : '')
  } catch {
    // Si ce n’est pas une URL absolue, on retire un éventuel ?v=... à la main
    const [path, qs] = u.split('?')
    if (!qs) return path
    const kept = qs
      .split('&')
      .filter(p => !p.startsWith('v='))
      .join('&')
    return kept ? `${path}?${kept}` : path
  }
}

const t = (s: string | null | undefined) => (s ?? '').trim()

export const hasFormChanges = (
  values: FormSlices,
  initial: InitialValues,
  currentAvatarInitial?: string | null
) => {
  const currentBirthDate = buildBirthDate({
    birthDay: values.birthDay,
    birthMonth: values.birthMonth,
    birthYear: values.birthYear,
  })

  const initialAvatar = currentAvatarInitial ?? initial.avatar_url ?? ''

  return (
    t(values.name) !== t(initial.name) ||
    t(values.country) !== t(initial.country) ||
    t(values.experience) !== t(initial.experience) ||
    t(values.mainGoal) !== t(initial.mainGoal) ||
    t(values.trainingPlace) !== t(initial.trainingPlace) ||
    t(values.weeklySessions) !== t(initial.weeklySessions) ||
    t(values.supplements) !== t(initial.supplements) ||
    t(values.gender) !== t(initial.gender) ||
    t(currentBirthDate) !== t(initial.birthDate) ||
    normalizeAvatar(values.profileImageUrl) !== normalizeAvatar(initialAvatar)
  )
}
