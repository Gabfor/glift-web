import clsx from "clsx";
import type { ReactNode } from "react";

type FieldRowProps = {
  children: ReactNode;
  show?: boolean;
  className?: string;
};

export default function FieldRow({ children, show = true, className }: FieldRowProps) {
  void show;

  return <div className={clsx("flex flex-col items-center", className)}>{children}</div>;
}
