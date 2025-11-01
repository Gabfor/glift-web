"use client"

export default function MesInformationsFormSkeleton() {
  const fieldPlaceholders = Array.from({ length: 9 })

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-[564px] max-w-full mt-4 mb-[30px]">
        <div className="h-[96px] rounded-[5px] bg-[#F4F5FE] animate-pulse" />
      </div>

      <div className="w-[368px] max-w-full flex flex-col items-center mb-[30px]">
        <div className="w-[140px] h-[140px] rounded-full bg-[#ECE9F1] animate-pulse" />
        <div className="w-[120px] h-[16px] rounded-full bg-[#ECE9F1] animate-pulse mt-4" />
      </div>

      <div className="w-full flex flex-col items-center gap-4 pb-4">
        {fieldPlaceholders.map((_, index) => (
          <div
            key={index}
            className="w-[368px] max-w-full h-[72px] bg-[#F4F5FE] rounded-[10px] animate-pulse"
          />
        ))}
        <div className="w-[368px] max-w-full h-[48px] bg-[#DFE0F6] rounded-[40px] animate-pulse" />
      </div>
    </div>
  )
}
