"use client";
import Link from "next/link";
import type { Tool } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/orodje/${tool.id}`}
      className="group relative flex items-center gap-3.5 px-4 py-3.5 bg-surface rounded-xl border border-border/50 hover:border-accent/20 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* Accent bar on hover */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 group-hover:h-8 bg-accent rounded-r-full transition-all duration-200" />

      <span
        className={`w-9 h-9 ${tool.color} rounded-lg flex items-center justify-center text-white text-[15px] shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200`}
      >
        {tool.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-txt leading-tight">
          {tool.title}
        </p>
        <p className="text-[11px] text-txt3 mt-0.5 leading-tight">{tool.sub}</p>
      </div>
      <svg
        className="w-4 h-4 text-txt3 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-200 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
