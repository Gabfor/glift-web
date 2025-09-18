'use client'
export default function CongratsAlert() {
  return (
    <div className="w-[564px] max-w-full mt-4">
      <div className="relative bg-[#E3F9E5] rounded-[5px] px-5 py-2.5 text-left">
        <span className="absolute left-0 top-0 h-full w-[3px] bg-[#57AE5B]" />
        <h3 className="text-[#207227] font-bold text-[12px]">Félicitations !</h3>
        <p className="text-[#57AE5B] font-semibold text-[12px] leading-relaxed">
          Votre profil est complet à 100% ! Nous allons pouvoir personnaliser encore plus votre
          expérience avec Glift. N’hésitez pas à mettre régulièrement à jour vos informations.
        </p>
      </div>
    </div>
  )
}
