import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { tool_id } = await req.json();
    if (!tool_id || typeof tool_id !== "string") {
      return NextResponse.json({ error: "tool_id je obvezen" }, { status: 400 });
    }

    await supabase.from("conversions").insert({ tool_id });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Napaka" }, { status: 500 });
  }
}
