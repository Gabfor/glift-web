export default function SuccessMsg({ children }: { children: string }) {
  return (
    <p className="text-[#00D591] text-[13px] font-medium">
      {children}
    </p>
  )
}
