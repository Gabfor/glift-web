"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Accordion } from "@/components/ui/accordion";
import MesInformationsSection from "@/components/account/sections/MesInformationsSection";
import MotDePasseSection from "@/components/account/sections/MotDePasseSection";
import AbonnementSection from "@/components/account/sections/AbonnementSection";
import PreferencesSection from "@/components/account/sections/PreferencesSection";
import DeleteAccountButtonWithModal from "@/components/account/DeleteAccountButtonWithModal";

export default function ComptePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isAuthResolved } = useUser();

  const [openSections, setOpenSections] = useState<string[]>([]);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const fromQuery = (sp.get("section") || "").trim();
    const fromHash = window.location.hash.replace("#", "").trim();
    const section = fromQuery || fromHash;
    if (section) setOpenSections([section]);
  }, []);

  useEffect(() => {
    if (!searchParams) return;
    const s = (searchParams.get("section") || "").trim();
    if (s) setOpenSections([s]);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHash = () => {
      const h = window.location.hash.replace("#", "").trim();
      if (h) setOpenSections([h]);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (redirectedRef.current) return;
    if (isAuthResolved && !isAuthenticated) {
      redirectedRef.current = true;
      router.replace("/connexion");
    }
  }, [isAuthenticated, isAuthResolved, router]);

  if (!isAuthResolved) {
    return null;
  }

  if (!isAuthenticated || !user) return null;

  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[60px]">
      <div className="max-w-[1152px] mx-auto text-center flex flex-col items-center">
        <h1 className="text-[30px] font-bold text-[#2E3271] mb-[10px]">
          Bienvenue dans votre compte
        </h1>
        <p className="text-[15px] sm:text-[16px] font-semibold text-[#5D6494] leading-snug mb-[40px]">
          Mettez à jour votre profil, modifiez vos informations ou votre abonnement.
        </p>

        <div className="w-[760px]">
          <Accordion
            type="multiple"
            className="space-y-[30px]"
            value={openSections}
            onValueChange={setOpenSections}
          >
            <MesInformationsSection user={user} />
            <MotDePasseSection />
            <AbonnementSection />
            <PreferencesSection />
          </Accordion>

          <div className="mt-[50px]">
            <DeleteAccountButtonWithModal />
          </div>
        </div>
      </div>
    </main>
  );
}
