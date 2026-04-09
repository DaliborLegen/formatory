import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Formatory — Pretvori vse na enem mestu",
  description: "Brezplacno spletno orodje za pretvorbo dokumentov, slik in videov. PDF, Word, Excel, slike, video — vse na enem mestu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-bg text-txt antialiased">{children}</body>
    </html>
  );
}
