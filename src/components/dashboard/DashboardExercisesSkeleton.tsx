import React, { Fragment } from "react";
import DashboardFiltersSkeleton from "@/components/dashboard/DashboardFiltersSkeleton";

const skeletonExercises = Array.from({ length: 3 });

type DashboardExercisesSkeletonProps = {
  showFilters?: boolean;
  showStats?: boolean;
};

export default function DashboardExercisesSkeleton({
  showFilters = true,
  showStats = false,
}: DashboardExercisesSkeletonProps) {
  return (
    <div>
      <div className="animate-pulse">
        {showFilters && <DashboardFiltersSkeleton showStats={showStats} className="my-[30px]" />}

        <div>
          {skeletonExercises.map((_, index) => (
            <Fragment key={index}>
              {index > 0 && <div className="w-full h-[1px] bg-[#ECE9F1] my-[20px]" />}
              <div className="w-full flex flex-col xl:flex-row gap-[24px]">
                {/* ZONE 1: Graphique + Header */}
                <div className="w-full xl:w-auto xl:flex-[3] flex flex-col bg-white border border-[#D7D4DC] rounded-[20px] overflow-hidden shadow-glift h-[339px] flex-shrink-0 xl:flex-shrink">
                  <div className="h-[60px] flex items-center justify-between px-4 sm:px-[30px] border-b border-[#D7D4DC] shrink-0">
                    <div className="h-[16px] w-[150px] bg-[#ECE9F1] rounded" />
                    <div className="flex items-center gap-2 sm:gap-[20px]">
                      <div className="h-[20px] w-[20px] bg-[#ECE9F1] rounded" />
                      <div className="h-[20px] w-[20px] bg-[#ECE9F1] rounded" />
                    </div>
                  </div>
                  <div className="flex-1 p-[10px] flex">
                    <div className="w-[30px] h-full flex flex-col justify-between py-2">
                      <div className="h-[10px] w-full bg-[#ECE9F1] rounded" />
                      <div className="h-[10px] w-full bg-[#ECE9F1] rounded" />
                      <div className="h-[10px] w-full bg-[#ECE9F1] rounded" />
                      <div className="h-[10px] w-full bg-[#ECE9F1] rounded" />
                      <div className="h-[10px] w-full bg-[#ECE9F1] rounded" />
                    </div>
                    <div className="flex-1 ml-4 bg-[#ECE9F1] rounded-[10px] h-full" />
                  </div>
                </div>

                {/* ZONE 2: Records Carousel */}
                <div className="w-full max-w-[390px] mx-auto xl:max-w-none xl:mx-0 xl:w-[270px] flex-shrink-0 flex items-center justify-center h-[339px]">
                  <div className="w-[220px] h-[339px] rounded-[24px] border border-[#D7D4DC] bg-white p-[20px] shadow-glift flex flex-col justify-between">
                    <div className="w-full flex flex-col gap-4">
                      <div className="flex justify-between">
                        <div className="h-[18px] w-[18px] bg-[#ECE9F1] rounded-full" />
                        <div className="h-[18px] w-[18px] bg-[#ECE9F1] rounded-full" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-[40px] w-[40px] bg-[#ECE9F1] rounded-[12px]" />
                        <div className="space-y-2">
                          <div className="h-[22px] w-[60px] bg-[#ECE9F1] rounded" />
                          <div className="h-[11px] w-[80px] bg-[#ECE9F1] rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="w-[134px] h-[134px] rounded-full border-[10px] border-[#ECE9F1] mx-auto" />
                    <div className="space-y-2 w-full">
                      <div className="h-[40px] w-full bg-[#ECE9F1] rounded-full" />
                      <div className="h-[15px] w-[100px] bg-[#ECE9F1] rounded mx-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
