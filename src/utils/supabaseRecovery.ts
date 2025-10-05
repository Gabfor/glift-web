const STORAGE_KEY = "glift.supabase.password-recovery-code-verifier"
const TTL_MS = 30 * 60 * 1000

type RecoveryRecord = {
  codeVerifier: string
  storedAt: number
}

const isBrowserEnvironment = () => typeof window !== "undefined"

const parseRecoveryRecord = (rawValue: string | null): RecoveryRecord | null => {
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<RecoveryRecord>

    if (
      !parsed ||
      typeof parsed.codeVerifier !== "string" ||
      parsed.codeVerifier.trim() === "" ||
      typeof parsed.storedAt !== "number"
    ) {
      return null
    }

    return {
      codeVerifier: parsed.codeVerifier,
      storedAt: parsed.storedAt,
    }
  } catch {
    return null
  }
}

export const saveSupabaseRecoveryCodeVerifier = (codeVerifier: string): boolean => {
  if (!isBrowserEnvironment()) {
    return false
  }

  const record: RecoveryRecord = {
    codeVerifier,
    storedAt: Date.now(),
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
    return true
  } catch (storageError) {
    console.error(
      "Impossible d'enregistrer le code verifier de récupération Supabase",
      storageError
    )
    return false
  }
}

export const readSupabaseRecoveryCodeVerifier = (): RecoveryRecord | null => {
  if (!isBrowserEnvironment()) {
    return null
  }

  let record: RecoveryRecord | null = null

  try {
    record = parseRecoveryRecord(window.localStorage.getItem(STORAGE_KEY))
  } catch (storageError) {
    console.error(
      "Impossible de lire le code verifier de récupération Supabase",
      storageError
    )
    return null
  }

  if (!record) {
    removeSupabaseRecoveryCodeVerifier()
    return null
  }

  const age = Date.now() - record.storedAt
  if (age > TTL_MS) {
    removeSupabaseRecoveryCodeVerifier()
    return null
  }

  return record
}

export const removeSupabaseRecoveryCodeVerifier = () => {
  if (!isBrowserEnvironment()) {
    return
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch (storageError) {
    console.error(
      "Impossible de supprimer le code verifier de récupération Supabase",
      storageError
    )
  }
}
