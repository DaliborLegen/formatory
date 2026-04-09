"use client";
import Link from "next/link";
import type { Tool } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/orodje/${tool.id}`}
      className="group flex items-center gap-4 px-5 py-4 bg-surface rounded-xl border border-border/60 hover:border-accent/30 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <span className={`w-10 h-10 ${tool.color} rounded-xl flex items-center justify-center text-white text-lg shrink-0 shadow-sm`}>
        {tool.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-txt">{tool.title}</p>
        <p className="text-xs text-txt2 mt-0.5">{tool.sub}</p>
      </div>
      <span className="text-txt3 text-lg group-hover:translate-x-1 group-hover:text-accent transition-all duration-200">→</span>
    </Link>
  );
}
