"use client";
import Image from "next/image";

export default function GliftLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-4 text-center">
      <Image
        src="/logo-glift.svg"
        alt="Glift"
        width={150}
        height={57}
        priority
        className="mb-6"
      />
      <div className="relative h-[3px] w-[100px] overflow-hidden rounded-full bg-gray-200">
        <div className="animate-bar-loader absolute inset-0 bg-[#7069FA]" />
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
