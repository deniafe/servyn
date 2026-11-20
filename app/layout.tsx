import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { CartDrawer } from "@/components/home/CartDrawer";
import { CartProvider } from "@/components/home/CartProvider";
import { MotionProvider } from "@/components/home/MotionProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  axes: ["opsz", "WONK"],
});

export const metadata: Metadata = {
  title: "Servyn — Find your people. Book your services. Shop your culture.",
  description:
    "Servyn is a UK-focused, Afro-Caribbean marketplace to discover and book trusted local services, shop African products, and build lasting relationships with the people and businesses you choose. Live in Manchester.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden font-sans bg-cream text-ink">
        <MotionProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
