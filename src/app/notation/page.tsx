"use client";

import BackLink from "@/components/BackLink";

export default function NotationPage() {
    return (
        <main className="min-h-screen bg-[#FBFCFE] pt-[140px] [&_strong]:text-[#3A416F] [&_b]:text-[#3A416F]">
            <div className="max-w-[1152px] mx-auto px-4">
                <BackLink href="/concept" className="mb-[30px]">
                    Accueil
                </BackLink>
                <div className="text-center">
                <h1 className="text-[30px] font-bold text-[#2E3271] mb-6">
                    Notez facilement vos performances
                </h1>
                <p className="text-[16px] text-[#5D6494] font-semibold max-w-2xl mx-auto leading-relaxed">
                    Notez vos performances et vos sensations. Ajustez vos entraînements afin de toujours progresser.
                </p>
            </div>
        </div>
    </main>
    );
}
