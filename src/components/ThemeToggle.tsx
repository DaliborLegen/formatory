"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-full border border-border hover:border-accent/40 bg-surface hover:bg-surface-hover flex items-center justify-center transition-all duration-200 text-sm"
      aria-label="Preklopi temo"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
