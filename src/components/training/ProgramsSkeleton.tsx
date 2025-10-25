const skeletonPrograms = Array.from({ length: 2 });
const skeletonTrainings = Array.from({ length: 3 });

export default function ProgramsSkeleton() {
  return (
    <div className="w-full max-w-[1152px] space-y-6 animate-pulse">
      {skeletonPrograms.map((_, programIndex) => (
        <div key={programIndex} className="w-full">
          <div className="flex items-center justify-center mb-2">
            <div className="flex h-[50px] w-full max-w-[540px] items-center justify-center rounded-[5px] border border-[#ECE9F1] bg-white">
              <div className="h-4 w-40 rounded bg-[#E6E8F5]" />
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-4">
            {skeletonTrainings.map((_, trainingIndex) => (
              <div
                key={trainingIndex}
                className="flex h-[60px] w-[270px] items-center gap-4 rounded-[5px] border border-[#ECE9F1] bg-white px-4"
              >
                <div className="h-[25px] w-[25px] rounded bg-[#E6E8F5]" />
                <div className="h-4 flex-1 rounded bg-[#E6E8F5]" />
                <div className="h-[25px] w-[25px] rounded bg-[#E6E8F5]" />
              </div>
            ))}
            <div className="h-[60px] w-[270px] rounded-[6px] border-2 border-dashed border-[#E6E8F5]" />
          </div>
        </div>
      ))}
    </div>
  );
}
