import type { ReactNode } from "react";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return <div data-shell="customer">{children}</div>;
}
