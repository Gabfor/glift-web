export default function BlogArticleCardSkeleton({ 
  maxWidth = "270px", 
  imageHeight = "180px" 
}: { 
  maxWidth?: string; 
  imageHeight?: string; 
}) {
  return (
    <div 
      className="w-full bg-white rounded-[15px] border border-[#D7D4DC] overflow-hidden flex flex-col h-full animate-pulse"
      style={{ maxWidth }}
    >
      <div 
        className="w-full bg-[#E6E8F5]"
        style={{ height: imageHeight }}
      >
        {/* Placeholder for Badge */}
        <div className="mt-[15px] ml-[15px] bg-[#E6E8F5] h-[20px] w-[60px] rounded-[10px]" />
      </div>

      <div className="pt-2 px-2.5 pb-5 flex-1 flex flex-col items-start gap-4">
        {/* Title */}
        <div className="w-full">
          <div className="h-4 bg-[#E6E8F5] rounded mb-2 w-[90%]" />
          <div className="h-4 bg-[#E6E8F5] rounded w-[60%]" />
        </div>

        {/* Badges */}
        <div className="flex justify-start flex-wrap gap-[5px]">
          <div className="bg-[#E6E8F5] h-[25px] w-[50px] rounded-[5px]" />
          <div className="bg-[#E6E8F5] h-[25px] w-[70px] rounded-[5px]" />
          <div className="bg-[#E6E8F5] h-[25px] w-[25px] rounded-[5px]" />
        </div>
        
        {/* Description */}
        <div className="w-full flex-1">
          <div className="h-3 bg-[#E6E8F5] rounded mb-1.5 w-[100%]" />
          <div className="h-3 bg-[#E6E8F5] rounded mb-1.5 w-[90%]" />
          <div className="h-3 bg-[#E6E8F5] rounded w-[70%]" />
        </div>

        {/* Button */}
        <div className="mt-auto mx-auto bg-[#E6E8F5] h-[45px] w-[200px] rounded-full" />
      </div>
    </div>
  );
}
