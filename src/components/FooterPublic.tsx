"use client";

import Link from "next/link";
import Image from "next/image";
import CTAButton from "@/components/CTAButton";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faXTwitter, faInstagram, faYoutube } from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <footer className="mb-[3px] max-w-[1152px] mx-auto bg-[#FBFCFE] text-[#5D6494] text-sm font-medium border-t border-[#ECE9F1] pt-[0px] pb-[30px]">
      {/* Top Section */}
      <div className="mt-[20px] max-w-[1152px] mx-auto flex flex-col lg:flex-row justify-between items-center gap-10 border-b border-[#ECE9F1] pb-[30px]">
        {/* Left - Logo + Description */}
        <div className="flex flex-col gap-4 max-w-md">
          <div className="flex items-center gap-3">
            <Image src="/logo_beta.svg" alt="Logo Glift" width={147} height={35} />
          </div>
          <p className="text-[#5D6494] font-semibold leading-relaxed max-w-[368px]">
            Glift est une plateforme qui permet de digitaliser ses programmes de musculation, d’analyser ses performances et de progresser efficacement.
          </p>
        </div>

        {/* Right - CTA */}
        <div className="flex flex-col items-start gap-2">
        <CTAButton href="/inscription?plan=premium" className="font-bold text-[16px]">
          <span className="inline-flex items-center gap-2">
            Tester gratuitement
            <Image src="/icons/arrow.svg" className="ml-[-5px]" alt="Flèche" width={25} height={25} />
          </span>
        </CTAButton>
          {/* Texte centré sous le CTA */}
          <span className="text-[14px] font-semibold text-[#5D6494] flex items-center justify-center w-[204px] gap-2">
            <span className="relative w-[8px] h-[8px]">
            {/* Onde accentuée */}
            <span className="absolute inset-0 rounded-full bg-[#00D591] opacity-50 animate-ping"></span>
            {/* Point central */}
            <span className="relative w-[8px] h-[8px] rounded-full bg-[#00D591] block"></span>
          </span>
          30 jours pour tester
        </span>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="max-w-[1152px] mx-auto mt-[30px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 text-white">
        <div>
        <h4 className="text-[#3A416F] font-bold mb-2">
        <Link href="#">GLIFT</Link>
        </h4>
          <ul className="text-[#5D6494] font-semibold space-y-1">
            <li><Link href="/store" className="hover:text-[#3A416F] transition-colors">Glift Store</Link></li>
            <li><Link href="/shop" className="hover:text-[#3A416F] transition-colors">Glift Shop</Link></li>
            <li><Link href="/tarifs" className="hover:text-[#3A416F] transition-colors">Tarifs</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[#3A416F] font-bold mb-2">
          <Link href="#">APPS MOBILE</Link>
          </h4>
          <ul className="text-[#5D6494] font-semibold space-y-1">
            <li><Link href="#" className="hover:text-[#3A416F] transition-colors">App iOS</Link></li>
            <li><Link href="#" className="hover:text-[#3A416F] transition-colors">App Android</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[#3A416F] font-bold mb-2">
          <Link href="#">AIDE</Link>
          </h4>
          <ul className="text-[#5D6494] font-semibold space-y-1">
            <li><Link href="#" className="hover:text-[#3A416F] transition-colors">Questions</Link></li>
            <li><Link href="#" className="hover:text-[#3A416F] transition-colors">Nous contacter</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[#3A416F] font-bold mb-2">
          <Link href="#">LIENS</Link>
          </h4>
          <ul className="text-[#5D6494] font-semibold space-y-1">
            <li><Link href="#" className="hover:text-[#3A416F] transition-colors">CGU</Link></li>
            <li><Link href="#" className="hover:text-[#3A416F] transition-colors">Mentions légales</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[#3A416F] font-bold mb-2">
          <Link href="#">AUTRES</Link>
          </h4>
          <ul className="text-[#5D6494] font-semibold space-y-1">
            <li><Link href="#" className="hover:text-[#3A416F] transition-colors">Press Kit</Link></li>
          </ul>
        </div>
      </div>

      {/* Copyright + Réseaux */}
      <div className="max-w-[1152px] mx-auto mt-[20px] flex flex-col md:flex-row justify-between  md:items-center text-[#5D6494] text-sm gap-[20px] font-semibold">
        <p>Copyright © 2025 Glift. Tous droits réservés.</p>
        <div className="flex items-center gap-[15px]">
          <Link href="#"><FontAwesomeIcon icon={faFacebookF} className="text-[#5D6494] hover:text-[#3A416F] !w-[20px] !h-[20px]" aria-label="Facebook"/></Link>
          <Link href="#"><FontAwesomeIcon icon={faXTwitter} className="text-[#5D6494] hover:text-[#3A416F] !w-[20px] !h-[20px]" aria-label="X (Twitter)"/></Link>
          <Link href="#"><FontAwesomeIcon icon={faInstagram} className="text-[#5D6494] hover:text-[#3A416F] !w-[20px] !h-[20px]" aria-label="Instagram"/></Link>
          <Link href="#"><FontAwesomeIcon icon={faYoutube} className="text-[#5D6494] hover:text-[#3A416F] !w-[20px] !h-[20px]" aria-label="Youtube"/></Link>
        </div>
      </div>
    </footer>
  );
}