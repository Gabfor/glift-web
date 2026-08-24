"use client"

import ModalMessage from "@/components/ui/ModalMessage"

export default function ProfileCompleteAlert() {
  return (
    <div className="w-[564px] max-w-full mt-4 mb-[30px]">
      <ModalMessage
        variant="success"
        title="Félicitations !"
        description="Ton profil est complet à 100% ! Nous allons pouvoir personnaliser encore plus ton expérience avec Glift. N’hésite pas à mettre régulièrement à jour tes informations."
      />
    </div>
  )
}
