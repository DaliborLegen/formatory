"use client";
import ThemeToggle from "./ThemeToggle";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-bar/80 backdrop-blur-xl border-b border-divider">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-5 h-14">
        <Link href="/" className="text-lg font-bold text-txt tracking-tight">
          Formatory
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
