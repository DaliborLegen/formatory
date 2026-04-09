"use client";
import { useState } from "react";
import Header from "@/components/Header";
import ParticleBackground from "@/components/ParticleBackground";

export default function KontaktPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      <ParticleBackground />
      <Header />
      <main className="relative z-10 flex-1 max-w-lg mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-bold text-txt mb-2">Kontakt</h1>
        <p className="text-sm text-txt2 mb-8">Imate vprašanje ali predlog? Pišite nam.</p>

        {status === "sent" ? (
          <div className="bg-surface rounded-xl border border-accent2/30 p-8 text-center">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-lg font-bold text-txt mb-1">Sporočilo poslano!</p>
            <p className="text-sm text-txt2">Odgovorili vam bomo v najkrajšem možnem času.</p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 bg-accent hover:bg-accent-hover text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-all"
            >
              Pošlji novo sporočilo
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="bg-surface rounded-xl border border-border p-5 shadow-sm space-y-4">
              <div>
                <label className="text-sm font-semibold text-txt mb-1.5 block">Ime</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Vaše ime"
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-txt mb-1.5 block">E-pošta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vas@email.com"
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-txt mb-1.5 block">Sporočilo</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Vpišite vaše sporočilo..."
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-txt focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
                />
              </div>
            </div>

            {status === "error" && (
              <p className="text-sm text-red font-medium">Napaka pri pošiljanju. Poskusite znova.</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 text-sm shadow-sm"
            >
              {status === "sending" ? "Pošiljam..." : "Pošlji sporočilo"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
