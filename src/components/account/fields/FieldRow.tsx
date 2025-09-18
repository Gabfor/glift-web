'use client'

import React from 'react'
import MissingField from '@/components/account/fields/MissingField'

type Props = {
  show: boolean
  children: React.ReactNode
  /** Utile pour les Dropdowns qui ouvrent au mousedown (préserve les succès/bordures) */
  onMouseDown?: () => void
  /** Forward optionnel si ton MissingField supporte une largeur spécifique */
  widthPx?: number
}

export default function FieldRow({ show, children, onMouseDown, widthPx }: Props) {
  const content = (
    <MissingField show={show} {...(widthPx ? { widthPx } : {})}>
      {children}
    </MissingField>
  )

  return onMouseDown ? <div onMouseDown={onMouseDown}>{content}</div> : content
}
