"use client";

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-[30px] font-bold text-[#2E3271] mb-2">
            Blog
          </h1>
          <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494]">
            Découvrez nos conseils, programmes et astuces pour progresser
            <br />
            et atteindre vos objectifs, quel que soit votre niveau.
          </p>
          <div className="mt-[15px] bg-[#F4F5FE] rounded-[10px] p-[20px] text-[#A1A5FD] text-[14px] font-semibold text-left">
            Que votre objectif soit la prise de masse musculaire, la perte de gras (sèche) ou le développement de votre force, vous êtes au bon endroit. Découvrez nos conseils d'entraînement, ainsi que nos programmes de musculation complets et détaillés, adaptés aux débutants comme aux pratiquants confirmés. Ne laissez plus vos résultats au hasard, passez au niveau supérieur.
          </div>
        </div>
      </div>
    </main>
  );
}
