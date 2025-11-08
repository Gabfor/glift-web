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
          <div
            key={index}
            className="w-full rounded-[5px] border border-[#ECE9F1] bg-white shadow-glift"
          >
            <div className="flex h-[60px] items-center justify-between px-[30px]">
              <div className="h-4 w-[220px] rounded bg-[#E6E8F5]" />
              <div className="flex items-center gap-[30px]">
                <div className="flex items-center gap-3">
                  <div className="h-[18px] w-[18px] rounded-full bg-[#E6E8F5]" />
                  <div className="h-5 w-[130px] rounded bg-[#E6E8F5]" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-[18px] w-[18px] rounded-full bg-[#E6E8F5]" />
                  <div className="h-5 w-[130px] rounded bg-[#E6E8F5]" />
                </div>
              </div>
            </div>
            <div className="border-t border-[#F2F1F6] px-[30px] py-[20px] space-y-[20px]">
              <div className="flex flex-wrap gap-3">
                <div className="h-10 w-[190px] rounded-[5px] bg-[#E6E8F5]" />
                <div className="h-10 w-[190px] rounded-[5px] bg-[#E6E8F5]" />
                <div className="h-10 w-[190px] rounded-[5px] bg-[#E6E8F5]" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="h-[90px] rounded-[5px] bg-[#F0F1FB]" />
                <div className="h-[90px] rounded-[5px] bg-[#F0F1FB]" />
                <div className="h-[90px] rounded-[5px] bg-[#F0F1FB]" />
                <div className="h-[90px] rounded-[5px] bg-[#F0F1FB]" />
              </div>
              <div className="h-[200px] rounded-[5px] bg-[#F0F1FB]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
