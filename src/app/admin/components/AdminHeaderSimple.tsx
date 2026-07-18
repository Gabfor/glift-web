import Image from "next/image";
import Link from "next/link";

export default function AdminHeaderSimple() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#FBFCFE]">
      <div className="max-w-[1152px] mx-auto px-4 md:px-0 h-[72px] flex items-center justify-start">
        <div className="flex items-center">
          <Link href="/connexion" className="flex items-center cursor-pointer">
            <Image
              src="/logo_admin.svg"
              alt="Logo Glift Admin"
              width={0}
              height={0}
              sizes="100vw"
              className="w-auto h-[35px]"
              priority
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
