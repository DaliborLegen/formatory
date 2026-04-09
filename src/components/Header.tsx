"use client";
import { useState, useRef, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-bar/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <Link href="/" className="text-xl font-bold text-txt tracking-tight">
          Formatory
        </Link>
        <nav className="hidden sm:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-txt hover:text-accent transition-colors">
            Domov
          </Link>
          <Link href="/o-nas" className="text-sm font-medium text-txt2 hover:text-accent transition-colors">
            O nas
          </Link>
          <Link href="/kontakt" className="text-sm font-medium text-txt2 hover:text-accent transition-colors">
            Kontakt
          </Link>
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="text-sm font-medium text-txt2 hover:text-accent transition-colors flex items-center gap-1"
            >
              Orodja
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
                {TOOLS.map((section) => (
                  <div key={section.section}>
                    <p className="text-[10px] font-semibold text-txt3 uppercase tracking-widest px-4 pt-3 pb-1">
                      {section.section}
                    </p>
                    {section.items.map((tool) => (
                      <Link
                        key={tool.id}
                        href={`/orodje/${tool.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors"
                      >
                        <span className={`w-7 h-7 ${tool.color} rounded-lg flex items-center justify-center text-white text-xs shrink-0`}>
                          {tool.icon}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-txt">{tool.title}</p>
                          <p className="text-[11px] text-txt3">{tool.sub}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
