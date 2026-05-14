import PagesTableSkeleton from "./PagesTableSkeleton";

export default function AdminPagesLoading() {
  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px] pb-[100px] flex justify-center">
      <div className="w-full max-w-6xl">
        <h2 className="text-[26px] sm:text-[30px] font-bold text-[#2E3271] text-center mb-[40px]">
          Pages
        </h2>

        <div className="h-[40px] mb-4 flex items-center justify-end">
          <div className="w-[20px] h-[20px] bg-[#E6E8F5] rounded-full animate-pulse" />
        </div>

        <PagesTableSkeleton />
      </div>
    </main>
  );
}
