import type { ReactNode } from "react";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <div data-shell="account">{children}</div>;
}
