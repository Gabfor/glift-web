import LegalTableSkeleton from "./LegalTableSkeleton";

export default function AdminLegalLoading() {
  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[100px] flex justify-center">
      <div className="w-full max-w-6xl">
        <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
          Pages légales
        </h2>

        <div className="mb-6 flex min-h-[40px] flex-col lg:flex-row lg:items-center justify-end">
          <div className="flex w-full justify-end lg:w-auto mt-[49px]">
            <div className="flex justify-end relative z-10">
              <div className="w-[20px] h-[20px] bg-[#E6E8F5] rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        <LegalTableSkeleton />
      </div>
    </main>
  );
}
