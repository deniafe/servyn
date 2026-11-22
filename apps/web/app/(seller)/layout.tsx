import type { ReactNode } from "react";

export default function SellerLayout({ children }: { children: ReactNode }) {
  return <div data-shell="seller">{children}</div>;
}
