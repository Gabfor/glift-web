import Image from "next/image";

export default function PagesTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="overflow-x-auto rounded-[8px] bg-white shadow-[0_3px_6px_rgba(93,100,148,0.15)]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#ECE9F1] h-[60px]">
            <tr>
              <th className="px-4 w-[48px]">
                <div className="flex items-center justify-center h-[60px] shrink-0 min-w-[15px]">
                  <div className="w-[15px] h-[15px] bg-[#E6E8F5] rounded-sm" />
                </div>
              </th>
              <th className="w-[82px] px-4">
                <div className="flex items-center gap-1">
                  <div className="h-4 w-12 bg-[#E6E8F5] rounded" />
                </div>
              </th>
              <th className="w-auto px-4">
                <div className="flex items-center gap-1">
                  <div className="h-4 w-24 bg-[#E6E8F5] rounded" />
                </div>
              </th>
              <th className="w-[120px] px-4">
                <div className="flex items-center gap-1">
                  <div className="h-4 w-16 bg-[#E6E8F5] rounded" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-[#ECE9F1] h-[60px]">
                <td className="px-4">
                  <div className="flex items-center justify-center h-[60px] shrink-0 min-w-[15px]">
                    <div className="w-[15px] h-[15px] bg-[#E6E8F5] rounded-sm" />
                  </div>
                </td>
                <td className="w-[82px] px-4 align-middle">
                  <div className="w-[40px] h-[20px] bg-[#E6E8F5] rounded-full" />
                </td>
                <td className="px-4 align-middle">
                  <div className="w-[200px] h-4 bg-[#E6E8F5] rounded" />
                </td>
                <td className="w-[120px] px-4 align-middle">
                  <div className="w-5 h-4 bg-[#E6E8F5] rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
