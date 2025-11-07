const skeletonFilters = Array.from({ length: 3 });

export default function DashboardFiltersSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-end gap-4 ${className ? className : ""}`}
    >
      <div className="flex flex-wrap gap-4 grow">
        {skeletonFilters.map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="h-4 w-[120px] rounded bg-[#E6E8F5]" />
            <div className="h-10 w-[240px] rounded-[5px] bg-[#E6E8F5]" />
          </div>
        ))}
      </div>
      <div className="h-10 w-[189px] rounded-[5px] bg-[#E6E8F5]" />
    </div>
  );
}
