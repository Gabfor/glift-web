const skeletonSlides = Array.from({ length: 3 });

export default function AdminSliderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="flex flex-col gap-6 w-full mx-auto">
          <div className="flex flex-col gap-3">
            <div className="h-5 w-40 rounded bg-[#E0E3F2]" />
            <div className="h-12 rounded-lg bg-[#E0E3F2]" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="h-5 w-48 rounded bg-[#E0E3F2]" />
            <div className="h-12 rounded-lg bg-[#E0E3F2]" />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {skeletonSlides.map((_, index) => (
            <div key={index} className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="h-5 w-28 rounded bg-[#E0E3F2]" />
                <div className="h-4 w-24 rounded bg-[#E0E3F2]" />
              </div>

              <div className="flex flex-col gap-6">
                <div className="h-[180px] rounded-2xl bg-[#E0E3F2]" />
                <div className="h-12 rounded-lg bg-[#E0E3F2]" />
                <div className="h-12 rounded-lg bg-[#E0E3F2]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
