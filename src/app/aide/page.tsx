"use client";

import Link from "next/link";

export default function AidePage() {
  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-[30px] font-bold text-[#2E3271] mb-2">
            Aide
          </h1>
          <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494]">
            Retrouvez les questions les plus fréquemment posées par nos utilisateurs.
            <br />
            Si vous avez d’autres questions,{" "}
            <Link
              href="/contact?from=aide"
              className="text-[#7069FA] hover:text-[#6660E4] hover:no-underline transition-colors"
            >
              contactez-nous
            </Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
