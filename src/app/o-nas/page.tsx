import Header from "@/components/Header";
import ParticleBackground from "@/components/ParticleBackground";
import Image from "next/image";

export default function ONasPage() {
  return (
    <>
      <ParticleBackground />
      <Header />
      <main className="relative z-10 flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-bold text-txt mb-2">O nas</h1>
        <p className="text-sm text-txt2 mb-10">
          Formatory.si je brezplačno spletno orodje za pretvorbo datotek, ki ga je razvilo podjetje AI Pro Solutions.
        </p>

        {/* AI Pro Solutions */}
        <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm mb-8">
          <div className="flex items-center gap-5 mb-6">
            <Image
              src="/aiprosolution-logo.png"
              alt="AI Pro Solutions"
              width={72}
              height={72}
              className="rounded-xl shrink-0"
            />
            <div>
              <h2 className="text-xl font-bold text-txt">AI Pro Solutions</h2>
              <a
                href="https://aiprosolutions.si"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline"
              >
                aiprosolutions.si
              </a>
            </div>
          </div>

          <p className="text-sm text-txt2 leading-relaxed mb-4">
            AI Pro Solutions je slovensko podjetje, specializirano za razvoj sodobnih spletnih rešitev,
            avtomatizacijo poslovnih procesov in implementacijo umetne inteligence. Pomagamo podjetjem
            digitalizirati poslovanje in izkoristiti moč AI tehnologij.
          </p>

          <h3 className="text-sm font-bold text-txt mt-6 mb-3">Naše storitve</h3>
          <div className="grid gap-3">
            {[
              { icon: "🌐", title: "Spletne strani in aplikacije", desc: "Sodobne, hitre in prilagojene spletne rešitve za vaše podjetje." },
              { icon: "🤖", title: "AI rešitve", desc: "Chatboti, avtomatizacija, analiza podatkov in integracija AI v vaše procese." },
              { icon: "⚡", title: "Avtomatizacija", desc: "Avtomatizacija ponavljajočih nalog, povezovanje sistemov in optimizacija delovnih tokov." },
              { icon: "📊", title: "Digitalna strategija", desc: "Svetovanje pri digitalni preobrazbi in izbiri pravih tehnoloških rešitev." },
            ].map((s) => (
              <div key={s.title} className="flex items-start gap-3 bg-bg2 rounded-xl p-4">
                <span className="text-xl shrink-0">{s.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-txt">{s.title}</p>
                  <p className="text-xs text-txt2 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <a
          href="https://aiprosolutions.si"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-accent hover:bg-accent-hover text-white font-semibold py-4 rounded-xl text-center text-sm transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Obiščite aiprosolutions.si →
        </a>

        {/* Formatory info */}
        <div className="mt-10 bg-surface rounded-2xl border border-border p-8 shadow-sm">
          <h2 className="text-lg font-bold text-txt mb-3">O Formatory.si</h2>
          <p className="text-sm text-txt2 leading-relaxed mb-3">
            Formatory.si je brezplačno orodje za pretvorbo dokumentov, slik in videov.
            Vse pretvorbe potekajo neposredno v vašem brskalniku — vaše datoteke nikoli
            ne zapustijo vašega računalnika.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {["100% zasebno", "Brezplačno", "Brez registracije", "Brez omejitev"].map((t) => (
              <span key={t} className="bg-accent/10 text-accent text-xs font-medium px-3 py-1.5 rounded-lg">
                {t}
              </span>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
