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
    <header className="sticky top-0 z-50 bg-bar/70 backdrop-blur-2xl border-b border-border/40">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 lg:px-8 h-[60px]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-xs">
            <span className="text-white text-sm font-bold">F</span>
          </div>
          <span className="text-[15px] font-bold text-txt tracking-tight">
            Formatory
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <Link
            href="/"
            className="px-3.5 py-2 text-[13px] font-medium text-txt hover:text-accent rounded-lg hover:bg-accent-soft transition-all duration-150"
          >
            Domov
          </Link>
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setOpen(!open)}
              className={`px-3.5 py-2 text-[13px] font-medium rounded-lg flex items-center gap-1.5 transition-all duration-150 ${
                open
                  ? "text-accent bg-accent-soft"
                  : "text-txt2 hover:text-txt hover:bg-accent-soft"
              }`}
            >
              Orodja
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <div className="absolute top-full right-0 mt-2 w-[320px] bg-surface border border-border rounded-2xl shadow-xl overflow-hidden animate-fade-up"
                style={{ animationDuration: "0.2s" }}
              >
                <div className="max-h-[70vh] overflow-y-auto py-2">
                  {TOOLS.map((section) => (
                    <div key={section.section}>
                      <p className="text-[10px] font-bold text-txt3 uppercase tracking-[0.1em] px-4 pt-3 pb-1.5">
                        {section.section}
                      </p>
                      {section.items.map((tool) => (
                        <Link
                          key={tool.id}
                          href={`/orodje/${tool.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 mx-2 px-3 py-2 rounded-xl hover:bg-bg2 transition-colors duration-100"
                        >
                          <span className={`w-8 h-8 ${tool.color} rounded-lg flex items-center justify-center text-white text-sm shrink-0`}>
                            {tool.icon}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-txt leading-tight">{tool.title}</p>
                            <p className="text-[11px] text-txt3 leading-tight mt-0.5">{tool.sub}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
