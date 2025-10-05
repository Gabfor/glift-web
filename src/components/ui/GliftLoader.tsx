"use client";
import Image from "next/image";

export default function GliftBarLoader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
      <Image
        src="/logo-glift.svg"
        alt="Glift"
        width={150}
        height={57}
        priority
        className="mb-6"
      />
      <div className="relative w-[100px] h-[3px] bg-gray-200 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-[#7069FA] animate-bar-loader" />
      </div>
      <style jsx>{`
        @keyframes bar-loader {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(-30%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-bar-loader {
          width: 50%;
          animation: bar-loader 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
