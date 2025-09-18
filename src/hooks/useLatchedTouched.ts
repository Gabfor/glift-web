// hooks/useLatchedTouched.ts
import { useRef, useMemo } from 'react'

/**
 * Garde une version "latched" des flags touched : 
 * s’il était true, il reste true tant qu’on ne l’a pas explicitement réinitialisé.
 */
export function useLatchedTouched(current: Record<string, boolean>) {
  const prevRef = useRef<Record<string, boolean>>(current)

  const latched = useMemo(() => {
    const result: Record<string, boolean> = { ...current }
    for (const k of Object.keys(current)) {
      if (prevRef.current[k] && !current[k]) {
        result[k] = true
      }
    }
    prevRef.current = result
    return result
  }, [current])

  return latched
}
