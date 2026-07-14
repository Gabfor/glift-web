import Image from "next/image";

export default function AdminHeaderSimple() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#FBFCFE]">
      <div className="max-w-[1152px] mx-auto px-4 md:px-0 h-[72px] flex items-center justify-start">
        <div className="flex items-center">
          <Image
            src="/logo_admin.svg"
            alt="Logo Glift Admin"
            width={0}
            height={0}
            sizes="100vw"
            className="w-auto h-[35px]"
            priority
          />
        </div>
      </div>
    </header>
  );
}
