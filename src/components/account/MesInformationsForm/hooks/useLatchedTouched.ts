import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchedState } from '../utils/types'

const emptyTouched: TouchedState = {
  name: false,
  birthDay: false,
  birthMonth: false,
  birthYear: false,
  gender: false,
  country: false,
  experience: false,
  mainGoal: false,
  trainingPlace: false,
  weeklySessions: false,
  supplements: false,
}

export function useLatchedTouched(initial?: Partial<TouchedState>) {
  const [touched, setTouched] = useState<TouchedState>({ ...emptyTouched, ...initial })
  const prevRef = useRef<TouchedState>(touched)
  const [resetCounter, setResetCounter] = useState(0)
  const [latchedTouched, setLatchedTouched] = useState<TouchedState>(touched)

  useEffect(() => {
    // latch logic
    setLatchedTouched((prev) => {
      const next: TouchedState = { ...touched }
      for (const k of Object.keys(prev) as Array<keyof TouchedState>) {
        if (prev[k] && !touched[k]) next[k] = true
      }
      prevRef.current = next
      return next
    })
  }, [touched])

  useEffect(() => {
    if (resetCounter > 0) {
      prevRef.current = { ...emptyTouched }
      setLatchedTouched({ ...emptyTouched })
      setTouched({ ...emptyTouched })
    }
  }, [resetCounter])

  const resetLatched = useCallback(() => setResetCounter((c) => c + 1), [])

  return {
    touched,
    setTouched,
    latchedTouched,
    resetLatched,
    clearAllTouched: () => setTouched({ ...emptyTouched }),
  }
}
