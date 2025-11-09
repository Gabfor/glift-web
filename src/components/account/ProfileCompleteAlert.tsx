"use client"

export default function ProfileCompleteAlert() {
  return (
    <div className="w-[564px] max-w-full mt-4 mb-[30px]">
      <div className="relative rounded-[8px] bg-[#E3F9E5] px-5 py-2.5 text-left">
        <span className="absolute left-0 top-0 h-full w-[3px] bg-[#57AE5B]" />
        <h3 className="text-[12px] font-bold text-[#207227]">Félicitations !</h3>
        <p className="text-[12px] font-semibold leading-relaxed text-[#57AE5B]">
          Votre profil est complet à 100% ! Nous allons pouvoir personnaliser encore plus votre
          expérience avec Glift. N’hésitez pas à mettre régulièrement à jour vos informations.
        </p>
      </div>
    </div>
  )
}
