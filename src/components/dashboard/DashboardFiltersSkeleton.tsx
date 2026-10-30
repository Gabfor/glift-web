import clsx from "clsx";

const skeletonFilters = Array.from({ length: 3 });
const skeletonStatsCards = Array.from({ length: 4 });

type DashboardFiltersSkeletonProps = {
  className?: string;
  showStats?: boolean;
};

export default function DashboardFiltersSkeleton({
  className,
  showStats = false,
}: DashboardFiltersSkeletonProps) {
  return (
    <div className={clsx("space-y-6", className)}>
      <div className="flex justify-end">
        <div className="h-10 w-full sm:w-[215px] rounded-[5px] bg-[#ECE9F1]" />
      </div>

      {showStats && (
        <div className="mt-[20px] mb-[30px]">
          <div className="w-auto -mx-5 xl:mx-0 xl:w-full overflow-x-auto no-scrollbar xl:overflow-x-visible">
            <div className="flex items-stretch justify-start gap-[24px] min-w-max px-5 xl:px-0 pb-2 pt-1 xl:flex-wrap">
              {skeletonStatsCards.map((_, index) => (
                <div
                  key={index}
                  className="flex h-[135px] w-[205px] xl:w-[270px] shrink-0 flex-col items-start justify-center gap-[5px] rounded-[20px] border border-[#D7D4DC] bg-white px-5 py-5 select-none"
                >
                  <div className="flex h-[36px] w-full items-center justify-start gap-3">
                    <div className="h-[28px] w-[28px] rounded-full bg-[#ECE9F1] shrink-0" />
                    <div className="h-[28px] w-[60px] rounded bg-[#ECE9F1]" />
                  </div>

                  <div className="flex flex-col gap-1.5 mt-1 w-full">
                    <div className="h-3.5 w-[130px] rounded bg-[#ECE9F1]" />
                    <div className="h-2.5 w-[80px] rounded bg-[#ECE9F1]" />
                    <div className="h-2.5 w-[100px] rounded bg-[#ECE9F1]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 w-full">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 grow w-full">
          {skeletonFilters.map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[240px] sm:max-w-[270px]"
            >
              <div className="h-4 w-[120px] rounded bg-[#ECE9F1]" />
              <div className="h-10 w-full rounded-[5px] bg-[#ECE9F1]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
