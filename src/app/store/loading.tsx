import StoreHeader from "@/components/store/StoreHeader";
import StoreGridSkeleton from "@/components/store/StoreGridSkeleton";

export default function StoreLoading() {
  return (
    <main className="min-h-screen bg-[#FBFCFE] px-4 pt-[140px]">
      <div className="max-w-[1152px] mx-auto">
        <StoreHeader />
      </div>
      <div className="max-w-[1152px] mx-auto">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4 animate-pulse">
          <div className="flex items-center flex-wrap gap-4 w-full">
            <div className="h-10 w-[153px] bg-[#E6E8F5] rounded-[5px]" />
            <div className="h-10 w-[189px] bg-[#E6E8F5] rounded-[5px]" />
          </div>
        </div>
        <StoreGridSkeleton />
      </div>
    </main>
  );
}
