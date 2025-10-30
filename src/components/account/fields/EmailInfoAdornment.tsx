"use client"

import InfoTooltipAdornment from "./InfoTooltipAdornment"

type Props = {
  message?: string
  iconSize?: number
}

export default function EmailInfoAdornment({
  message = "Pour des raisons techniques, votre email ne peut pas être modifié.",
  iconSize = 18,
}: Props) {
  return (
    <InfoTooltipAdornment
      message={message}
      iconSize={iconSize}
      ariaLabel="Plus d’informations sur l’email"
    />
  )
}
