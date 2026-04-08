"use client";
import Link from "next/link";
import type { Tool } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={`/orodje/${tool.id}`}
      className="group flex items-center gap-4 px-4 py-3.5 bg-surface rounded-none first:rounded-t-xl last:rounded-b-xl border-b border-divider last:border-b-0 hover:bg-surface-hover transition-colors cursor-pointer"
    >
      <span className={`w-9 h-9 ${tool.color} rounded-lg flex items-center justify-center text-white text-base shrink-0`}>
        {tool.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-txt">{tool.title}</p>
        <p className="text-xs text-txt2">{tool.sub}</p>
      </div>
      <span className="text-txt3 text-xl group-hover:translate-x-0.5 transition-transform">›</span>
    </Link>
  );
}
