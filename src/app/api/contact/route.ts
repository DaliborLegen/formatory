import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Vsa polja so obvezna" }, { status: 400 });
    }

    const { error } = await supabase.from("messages").insert({ name, email, message });

    if (error) {
      return NextResponse.json({ error: "Napaka pri shranjevanju" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Napaka" }, { status: 500 });
  }
}
