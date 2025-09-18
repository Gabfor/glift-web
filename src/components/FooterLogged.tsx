"use client";

import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faXTwitter, faInstagram, faYoutube } from "@fortawesome/free-brands-svg-icons";

export default function FooterConnected() {
  return (
    <footer className="mb-[3px] max-w-[1152px] mx-auto bg-[#FBFCFE] text-[#5D6494] text-sm font-medium border-t border-[#ECE9F1] pt-[30px] pb-[30px]">
      {/* Top Section - Logo uniquement */}
      <div className="max-w-[1152px] mx-auto flex flex-col lg:flex-row justify-between items-start gap-10 border-b border-[#ECE9F1] pb-[30px]">
        <div className="flex items-center gap-3">
          <Image src="/logo_beta.svg" alt="Logo Glift" width={147} height={35} />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="max-w-[1152px] mx-auto mt-[30px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 text-white">
        <div>
          <h4 className="text-[#3A416F] font-bold mb-2">
            <Link href="#">GLIFT</Link>
          </h4>
          <ul className="text-[#5D6494] font-semibold space-y-1">
            <li><Link href="#" className="hover:text-[#3A416F] transition-colors">Tableau de bord</Link></li>
            <li><Link href="/entrainements" className="hover:text-[#3A416F] transition-colors">Entraînements</Link></li>
            <li><Link href="/store" className="hover:text-[#3A416F] transition-colors">Glift Store</Link></li>
            <li><Link href="/shop" className="hover:text-[#3A416F] transition-colors">Glift Shop</Link></li>
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
      <div className="max-w-[1152px] mx-auto mt-[20px] flex flex-col md:flex-row justify-between md:items-center text-[#5D6494] text-sm gap-[20px] font-semibold">
        <p>Copyright © 2025 Glift. Tous droits réservés.</p>
        <div className="flex items-center gap-[15px]">
          <Link href="#"><FontAwesomeIcon icon={faFacebookF} className="text-[#5D6494] hover:text-[#3A416F] !w-[20px] !h-[20px]" aria-label="Facebook"/></Link>
          <Link href="#"><FontAwesomeIcon icon={faInstagram} className="text-[#5D6494] hover:text-[#3A416F] !w-[20px] !h-[20px]" aria-label="Instagram"/></Link>
          <Link href="#"><FontAwesomeIcon icon={faYoutube} className="text-[#5D6494] hover:text-[#3A416F] !w-[20px] !h-[20px]" aria-label="Youtube"/></Link>
        </div>
      </div>
    </footer>
  );
}
