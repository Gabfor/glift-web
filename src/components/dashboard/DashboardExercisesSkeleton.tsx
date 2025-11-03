const skeletonExercises = Array.from({ length: 3 });

export default function DashboardExercisesSkeleton() {
  return (
    <div className="space-y-[30px] animate-pulse">
      {skeletonExercises.map((_, index) => (
        <div
          key={index}
          className="w-full rounded-[5px] border border-[#ECE9F1] bg-white shadow-glift"
        >
          <div className="flex h-[60px] items-center justify-between px-[30px]">
            <div className="h-4 w-[220px] rounded bg-[#E6E8F5]" />
            <div className="flex items-center gap-[30px]">
              <div className="h-6 w-[160px] rounded bg-[#E6E8F5]" />
              <div className="h-6 w-[160px] rounded bg-[#E6E8F5]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
