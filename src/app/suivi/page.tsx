"use client";

import BackLink from "@/components/BackLink";

export default function SuiviPage() {
    return (
        <main className="min-h-screen bg-[#FBFCFE] pt-[140px] [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F]">
            <div className="max-w-[1152px] mx-auto px-4">
                <BackLink href="/concept" className="mb-[30px]">
                    Accueil
                </BackLink>
                <div className="text-center">
                    <h1 className="text-[30px] font-bold text-[#2E3271] mb-6">
                        Entraînez-vous efficacement
                    </h1>
                    <p className="text-[16px] text-[#5D6494] font-semibold max-w-2xl mx-auto leading-relaxed">
                        Nous avons créé une expérience simple et intuitive pour vous permettre d{"'"}optimiser votre temps d{"'"}entraînement.
                    </p>
                </div>
            </div>
        </main>
    );
}
