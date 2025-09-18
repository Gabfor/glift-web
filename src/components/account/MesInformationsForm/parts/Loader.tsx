'use client'
export default function Loader() {
  return (
    <div className="w-full max-w-[620px] animate-pulse">
      <div className="h-6 bg-[#ECE9F1] rounded mb-3" />
      <div className="h-[180px] bg-[#F4F5FE] rounded mb-4" />
      <div className="grid grid-cols-1 gap-3">
        <div className="h-10 bg-[#ECE9F1] rounded" />
        <div className="h-10 bg-[#ECE9F1] rounded" />
        <div className="h-10 bg-[#ECE9F1] rounded" />
        <div className="h-10 bg-[#ECE9F1] rounded" />
      </div>
      <div className="h-10 bg-[#ECE9F1] rounded mt-6" />
    </div>
  )
}
