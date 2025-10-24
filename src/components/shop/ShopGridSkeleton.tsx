const skeletonItems = Array.from({ length: 8 });

export default function ShopGridSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(270px,1fr))] justify-center mt-8">
      {skeletonItems.map((_, index) => (
        <div
          key={index}
          className="relative w-full max-w-[270px] bg-white rounded-[5px] border border-[#ECE9F1] overflow-hidden flex flex-col shadow-glift animate-pulse"
        >
          <div className="absolute top-0 right-0 overflow-hidden w-[110px] h-[110px]">
            <div className="absolute bg-[#E6E8F5] rotate-45 w-[150px] h-[24px] right-[-30px] top-[30px]" />
          </div>
          <div className="w-full h-[180px] bg-[#E6E8F5]" />
          <div className="flex justify-center -mt-8">
            <div className="w-[70px] h-[70px] rounded-full border-[3px] border-white bg-[#E6E8F5]" />
          </div>
          <div className="pt-2.5 px-2.5 pb-5 flex-1 flex flex-col gap-3">
            <div className="h-4 bg-[#E6E8F5] rounded" />
            <div className="flex flex-wrap gap-[5px]">
              <span className="w-[60px] h-[22px] bg-[#F0F1FB] rounded" />
              <span className="w-[70px] h-[22px] bg-[#F0F1FB] rounded" />
              <span className="w-[80px] h-[22px] bg-[#F0F1FB] rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-[#E6E8F5] rounded" />
              <div className="h-3 bg-[#E6E8F5] rounded" />
              <div className="h-3 bg-[#E6E8F5] rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-[#E6E8F5] rounded" />
              <div className="h-3 bg-[#E6E8F5] rounded" />
              <div className="h-3 bg-[#E6E8F5] rounded w-2/3" />
            </div>
            <div className="mt-auto">
              <div className="h-10 bg-[#E6E8F5] rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
