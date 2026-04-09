import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Vsa polja so obvezna" }, { status: 400 });
    }

    // Shrani v Supabase
    await supabase.from("messages").insert({ name, email, message });

    // Pošlji email
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Formatory.si <onboarding@resend.dev>",
      to: "dalibor.legen@gmail.com",
      subject: `Novo sporočilo od ${name}`,
      html: `
        <h2>Novo sporočilo s Formatory.si</h2>
        <p><strong>Ime:</strong> ${name}</p>
        <p><strong>E-pošta:</strong> ${email}</p>
        <p><strong>Sporočilo:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Napaka" }, { status: 500 });
  }
}
