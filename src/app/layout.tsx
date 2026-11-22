import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import StoreProvider from "@/store/provider";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "KBS Cosmetics Admin", template: "%s | KBS Cosmetics Admin" },
  description: "Back office for the KBS Cosmetics store",
  robots: { index: false, follow: false },
  applicationName: "KBS Admin",
  appleWebApp: { capable: true, title: "KBS Admin", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets the layout use the safe-area insets on notched phones
  themeColor: "#db2777",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh font-sans">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
