import type { ReactNode } from "react";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <div data-shell="onboarding">{children}</div>;
}
