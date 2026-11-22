import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import StoreProvider from "@/store/provider";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "E-commerce Cosmetics Admin", template: "%s | E-commerce Cosmetics Admin" },
  description: "Admin site for the companies selling on E-commerce Cosmetics",
  robots: { index: false, follow: false },
  applicationName: "E-commerce Cosmetics Admin",
  appleWebApp: { capable: true, title: "EC Admin", statusBarStyle: "default" },
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
