'use client'

import { useCallback } from 'react'

/**
 * Petits helpers pour réduire la répétition autour de touched + resetSuppress.
 * T est la forme de ton state 'touched' (ex: { name: boolean; birthDay: boolean; ... }).
 */
export function useTouchedHelpers<T extends Record<string, boolean>>(
  resetSuppress: () => void,
  setTouched: React.Dispatch<React.SetStateAction<T>>
) {
  const markTouched = useCallback(
    (key: keyof T) => {
      setTouched((prev) => ({ ...prev, [key]: true } as T))
    },
    [setTouched]
  )

  const changeAndTouch = useCallback(
    <V,>(setter: (v: V) => void, key: keyof T) =>
      (v: V) => {
        resetSuppress()
        setter(v)
        setTouched((prev) => ({ ...prev, [key]: true } as T))
      },
    [resetSuppress, setTouched]
  )

  return { markTouched, changeAndTouch }
}
