import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Formatory — Pretvori vse na enem mestu",
  description:
    "Brezplacno spletno orodje za pretvorbo dokumentov, slik in videov. PDF, Word, Excel, slike, video — vse na enem mestu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="sl"
      className={`${jakarta.variable} ${instrument.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-bg text-txt antialiased">
        {children}
      </body>
    </html>
  );
}
