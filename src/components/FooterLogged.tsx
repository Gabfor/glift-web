"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faXTwitter, faInstagram, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLegalPages } from "@/hooks/useLegalPages";
import { useDashboardUrl } from "@/hooks/useDashboardUrl";

interface FooterLinkItem {
  label: string;
  href: string;
  isButton?: boolean;
}

export default function FooterConnected() {
  const { logoUrl, logoAlt } = useSiteSettings();
  const { publishedUrls, isLoading } = useLegalPages();
  const { dashboardUrl, shopUrl, storeUrl, trainingsUrl, blogUrl, helpUrl, contactUrl } = useDashboardUrl();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const sections: { title: string; links: FooterLinkItem[] }[] = [
    {
      title: "GLIFT",
      links: [
        { label: "Tableau de bord", href: dashboardUrl },
        { label: "Entraînements", href: trainingsUrl },
        { label: "Glift Store", href: storeUrl },
        { label: "Glift Shop", href: shopUrl },
        { label: "Blog", href: blogUrl },
      ],
    },
    {
      title: "APPS MOBILE",
      links: [
        { label: "App iOS", href: "/apps" },
        { label: "App Android", href: "/apps" },
      ],
    },
    {
      title: "AIDE",
      links: [
        { label: "Questions", href: helpUrl },
        { label: "Nous contacter", href: contactUrl },
      ],
    },
    {
      title: "LIENS",
      links: [
        !isLoading && publishedUrls.includes("cgu") && { label: "CGU", href: "/cgu" },
        !isLoading && publishedUrls.includes("politique-de-confidentialite") && { label: "Politique de confidentialité", href: "/politique-de-confidentialite" },
        !isLoading && publishedUrls.includes("mentions-legales") && { label: "Mentions légales", href: "/mentions-legales" },
        !isLoading && publishedUrls.includes("cgv") && { label: "CGV", href: "/cgv" },
      ].filter(Boolean) as FooterLinkItem[],
    },
    {
      title: "AUTRES",
      links: [
        { label: "Press Kit", href: "/press-kit" },
        !isLoading && publishedUrls.includes("politique-des-cookies") && { label: "Politique de cookies", href: "/politique-des-cookies" },
        { label: "Gestion des cookies", href: "#", isButton: true },
      ].filter(Boolean) as FooterLinkItem[],
    },
  ];

  return (
    <footer className="mt-[50px] md:mt-[100px] mb-[3px] max-w-[1152px] mx-auto bg-[#FBFCFE] text-[#5D6494] text-sm font-medium border-t border-[#ECE9F1] px-5 md:px-0 pt-0 pb-[30px]">
      {/* Top Section - Logo uniquement */}
      <div className="mt-[20px] max-w-[1152px] mx-auto flex flex-col lg:flex-row justify-between items-start gap-10 border-b border-[#ECE9F1] pb-[30px]">
        <div className="flex items-center gap-3">
          <Image src={logoUrl || "/logo_beta.svg"} alt={logoAlt || "Logo Glift"} width={0} height={0} sizes="100vw" className="w-auto h-[35px]" />
        </div>
      </div>

      {/* Mobile Accordion View (< lg) */}
      <div className="lg:hidden">
        {sections.map((sec) => (
          <div key={sec.title} className="border-b border-[#ECE9F1]">
            <button
              type="button"
              onClick={() => toggleSection(sec.title)}
              className="w-full py-4 flex items-center justify-between text-[#3A416F] font-bold text-[14px] tracking-wide cursor-pointer focus:outline-none"
            >
              <span>{sec.title}</span>
              <span className="text-[18px] font-bold text-[#3A416F]">
                {openSections[sec.title] ? "−" : "+"}
              </span>
            </button>
            {openSections[sec.title] && (
              <ul className="pb-4 text-[#5D6494] font-semibold space-y-2">
                {sec.links.map((link) => (
                  <li key={link.label}>
                    {link.isButton ? (
                      <button type="button" className="hover:text-[#3A416F] transition-colors">{link.label}</button>
                    ) : (
                      <Link href={link.href} className="hover:text-[#3A416F] transition-colors">{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Grid View (lg:) */}
      <div className="hidden lg:grid max-w-[1152px] mx-auto mt-[30px] grid-cols-5 gap-8">
        {sections.map((sec) => (
          <div key={sec.title}>
            <h4 className="text-[#3A416F] font-bold mb-2 text-[14px]">{sec.title}</h4>
            <ul className="text-[#5D6494] font-semibold space-y-1 text-sm">
              {sec.links.map((link) => (
                <li key={link.label}>
                  {link.isButton ? (
                    <button type="button" className="hover:text-[#3A416F] transition-colors">{link.label}</button>
                  ) : (
                    <Link href={link.href} className="hover:text-[#3A416F] transition-colors">{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Copyright + Réseaux */}
      <div className="max-w-[1152px] mx-auto mt-[30px] md:mt-[20px] flex flex-col md:flex-row justify-between items-center text-[#5D6494] text-sm gap-4 md:gap-[20px] font-semibold">
        <p className="order-2 md:order-1 text-center md:text-left">Copyright © 2026 Glift. Tous droits réservés.</p>
        <div className="order-1 md:order-2 flex items-center justify-center gap-[20px] md:gap-[15px]">
          <Link href="#" aria-label="Facebook"><FontAwesomeIcon icon={faFacebookF} className="text-[#3A416F] hover:text-[#7069FA] transition-colors !w-[18px] !h-[18px]" /></Link>
          <Link href="#" aria-label="X (Twitter)"><FontAwesomeIcon icon={faXTwitter} className="text-[#3A416F] hover:text-[#7069FA] transition-colors !w-[18px] !h-[18px]" /></Link>
          <Link href="#" aria-label="Instagram"><FontAwesomeIcon icon={faInstagram} className="text-[#3A416F] hover:text-[#7069FA] transition-colors !w-[18px] !h-[18px]" /></Link>
          <Link href="#" aria-label="Youtube"><FontAwesomeIcon icon={faYoutube} className="text-[#3A416F] hover:text-[#7069FA] transition-colors !w-[18px] !h-[18px]" /></Link>
        </div>
      </div>
    </footer>
  );
}
