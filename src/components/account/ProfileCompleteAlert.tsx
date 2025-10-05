"use client"

export default function ProfileCompleteAlert() {
  return (
    <div className="w-[564px] max-w-full mt-4 mb-[30px]">
      <div className="relative rounded-[5px] bg-[#E6FAF0] px-5 py-2.5 text-left">
        <span className="absolute left-0 top-0 h-full w-[3px] bg-[#34D399]" />
        <h3 className="text-[12px] font-bold text-[#0F9D58]">Félicitations !</h3>
        <p className="text-[12px] font-semibold leading-relaxed text-[#34D399]">
          Votre profil est complet à 100% ! Nous allons pouvoir personnaliser encore plus votre
          expérience avec Glift. N’hésitez pas à mettre régulièrement à jour vos informations.
        </p>
      </div>
    </div>
  )
}
