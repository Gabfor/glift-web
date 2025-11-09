const skeletonItems = Array.from({ length: 8 });

export default function StoreGridSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(270px,1fr))] justify-center mt-8">
      {skeletonItems.map((_, index) => (
        <div
          key={index}
          className="w-full max-w-[270px] bg-white rounded-[8px] border border-[#D7D4DC] overflow-hidden flex flex-col animate-pulse"
        >
          <div className="w-full h-[180px] bg-[#E6E8F5]" />
          <div className="flex justify-center -mt-8">
            <div className="w-[70px] h-[70px] rounded-full border-[3px] border-white bg-[#E6E8F5]" />
          </div>
          <div className="pt-2 px-2.5 pb-5 flex-1 flex flex-col gap-3">
            <div className="h-4 bg-[#E6E8F5] rounded" />
            <div className="flex flex-wrap gap-[5px]">
              <span className="w-[60px] h-[22px] bg-[#F0F1FB] rounded" />
              <span className="w-[70px] h-[22px] bg-[#F0F1FB] rounded" />
              <span className="w-[80px] h-[22px] bg-[#F0F1FB] rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-[#E6E8F5] rounded" />
              <div className="h-3 bg-[#E6E8F5] rounded" />
              <div className="h-3 bg-[#E6E8F5] rounded w-3/4" />
            </div>
            <div className="mt-auto">
              <div className="h-10 bg-[#E6E8F5] rounded" />
              <div className="h-3 bg-[#E6E8F5] rounded mt-3 w-1/2 mx-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
