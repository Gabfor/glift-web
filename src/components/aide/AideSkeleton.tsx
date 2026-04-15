export default function AideSkeleton() {
  return (
    <div className="w-full max-w-[760px] text-left mt-10 animate-pulse">
      {/* Category Filter Placeholder */}
      <div className="mb-[30px] flex justify-start z-20 relative">
        <div className="h-[40px] w-full max-w-[200px] bg-[#E6E8F5] rounded-[5px]" />
      </div>

      {/* Accordions Placeholders */}
      <div className="space-y-[20px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i} 
            className="border border-[#D7D4DC] bg-white rounded-[8px] h-[64px] flex items-center px-[20px] sm:px-[30px]"
          >
            <div className="h-4 bg-[#E6E8F5] rounded w-[60%]" />
            <div className="ml-auto w-[24px] h-[24px] rounded-full bg-[#E6E8F5]" />
          </div>
        ))}
      </div>
    </div>
  );
}
