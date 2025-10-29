import Image from "next/image";
import clsx from "clsx";

type CountryFlagProps = {
  code: string;
  size?: number;
  className?: string;
};

const FLAGPACK_CDN_BASE =
  "https://cdn.jsdelivr.net/npm/@flagpack/core@1.1.0/svg";

export default function CountryFlag({
  code,
  size = 18,
  className,
}: CountryFlagProps) {
  if (!code) {
    return null;
  }

  const normalized = code.trim().toLowerCase();
  const dimension = Math.max(size, 1);

  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center overflow-hidden rounded-[2px]",
        className,
      )}
      aria-hidden="true"
    >
      <Image
        src={`${FLAGPACK_CDN_BASE}/flag-${normalized}.svg`}
        alt=""
        width={dimension}
        height={dimension}
        sizes={`${dimension}px`}
        style={{ width: dimension, height: dimension }}
      />
    </span>
  );
}
