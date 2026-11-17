import type { Metadata } from "next";
import { Inter } from "next/font/google";
import StoreProvider from "@/store/provider";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "KBS Cosmetics Admin", template: "%s | KBS Cosmetics Admin" },
  description: "Back office for the KBS Cosmetics store",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
