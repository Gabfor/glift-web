import DashboardFiltersSkeleton from "@/components/dashboard/DashboardFiltersSkeleton";

const skeletonExercises = Array.from({ length: 3 });

type DashboardExercisesSkeletonProps = {
  showFilters?: boolean;
};

export default function DashboardExercisesSkeleton({
  showFilters = true,
}: DashboardExercisesSkeletonProps) {
  return (
    <div className="space-y-[30px]">
      <div className="animate-pulse space-y-[30px]">
        {showFilters && <DashboardFiltersSkeleton className="mt-[30px]" />}

        {skeletonExercises.map((_, index) => (
          <div key={index} className="w-full flex flex-col xl:flex-row gap-[24px]">
            {/* ZONE 1: Graphique + Header (approx 75% width or flex: 3) */}
            <div className="flex-1 xl:flex-[3] flex flex-col bg-white border border-[#D7D4DC] rounded-[20px] h-[339px]">
              <div className="h-[60px] flex items-center justify-between px-[30px] border-b border-[#D7D4DC]">
                <div className="h-[16px] w-[150px] bg-[#F0F1FB] rounded" />
                <div className="flex items-center gap-[20px]">
                  <div className="h-[20px] w-[20px] bg-[#F0F1FB] rounded" />
                  <div className="h-[20px] w-[20px] bg-[#F0F1FB] rounded" />
                </div>
              </div>
              <div className="flex-1 p-[10px] flex">
                <div className="w-[30px] h-full flex flex-col justify-between py-2">
                  <div className="h-[10px] w-full bg-[#F0F1FB] rounded" />
                  <div className="h-[10px] w-full bg-[#F0F1FB] rounded" />
                  <div className="h-[10px] w-full bg-[#F0F1FB] rounded" />
                  <div className="h-[10px] w-full bg-[#F0F1FB] rounded" />
                  <div className="h-[10px] w-full bg-[#F0F1FB] rounded" />
                </div>
                <div className="flex-1 ml-4 bg-[#F0F1FB] rounded-[10px] h-full" />
              </div>
            </div>

            {/* ZONE 2: Records Carousel (approx 25% width or flex: 1) */}
            <div className="w-full xl:w-[270px] flex-shrink-0 flex items-center justify-center h-[339px]">
              <div className="w-[220px] h-[339px] rounded-[24px] border border-[#D7D4DC] bg-white p-[20px] shadow-sm flex flex-col justify-between">
                <div className="w-full flex flex-col gap-4">
                  <div className="flex justify-between">
                    <div className="h-[18px] w-[18px] bg-[#F0F1FB] rounded-full" />
                    <div className="h-[18px] w-[18px] bg-[#F0F1FB] rounded-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-[40px] w-[40px] bg-[#F0F1FB] rounded-[12px]" />
                    <div className="space-y-2">
                      <div className="h-[22px] w-[60px] bg-[#F0F1FB] rounded" />
                      <div className="h-[11px] w-[80px] bg-[#F0F1FB] rounded" />
                    </div>
                  </div>
                </div>
                <div className="w-[134px] h-[134px] rounded-full border-[10px] border-[#F0F1FB] mx-auto" />
                <div className="space-y-2 w-full">
                  <div className="h-[40px] w-full bg-[#F0F1FB] rounded-full" />
                  <div className="h-[15px] w-[100px] bg-[#F0F1FB] rounded mx-auto" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
