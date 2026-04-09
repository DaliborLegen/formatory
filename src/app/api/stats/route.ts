import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Total conversions count
    const { count } = await supabase
      .from("conversions")
      .select("*", { count: "exact", head: true });

    // Per-tool stats
    const { data: toolStats } = await supabase
      .from("tool_stats")
      .select("*");

    return NextResponse.json({
      total: count || 0,
      tools: toolStats || [],
    });
  } catch {
    return NextResponse.json({ total: 0, tools: [] });
  }
}
