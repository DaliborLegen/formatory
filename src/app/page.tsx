import Header from "@/components/Header";
import ToolCard from "@/components/ToolCard";
import ParticleBackground from "@/components/ParticleBackground";
import StatsCounter from "@/components/StatsCounter";
import { TOOLS } from "@/lib/tools";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <ParticleBackground />
      <Header />
      <main className="relative z-10 flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-txt leading-tight tracking-tight mb-4">
            Pretvori vse na
            <br />
            <span className="text-accent">enem mestu</span>
          </h1>
          <p className="text-base sm:text-lg text-txt2 max-w-md mx-auto leading-relaxed">
            Dokumenti, slike, video — brezplacno spletno orodje za pretvorbo datotek. Vse poteka v vašem brskalniku.
          </p>
        </div>

        {/* Stats row */}
        <StatsCounter />

        {/* Tool sections */}
        {TOOLS.map((section) => (
          <div key={section.section} className="mb-10">
            <h2 className="text-xs font-semibold text-txt2 uppercase tracking-widest px-1 mb-4">
              {section.section}
            </h2>
            <div className="grid gap-3">
              {section.items.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        ))}

        {/* AI Pro Solution banner */}
        <div className="mt-16 mb-8">
          <a
            href="https://aiprosolutions.si"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gradient-to-r from-accent/10 via-accent2/10 to-accent/10 border border-accent/20 rounded-2xl p-6 hover:border-accent/40 transition-all duration-300 group"
          >
            <div className="flex items-center gap-5">
              <Image
                src="/aiprosolution-logo.png"
                alt="AI Pro Solutions"
                width={80}
                height={80}
                className="rounded-xl shrink-0"
              />
              <div className="flex-1">
                <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">
                  Izdelano s strani
                </p>
                <p className="text-lg font-bold text-txt group-hover:text-accent transition-colors">
                  AI Pro Solutions
                </p>
                <p className="text-sm text-txt2 mt-1">
                  Spletne strani, avtomatizacija in AI rešitve za vaše podjetje
                </p>
              </div>
              <span className="text-accent text-2xl group-hover:translate-x-1 transition-transform shrink-0">
                →
              </span>
            </div>
          </a>
        </div>

        {/* Instagram CTA */}
        <div className="mt-8 mb-10">
          <a
            href="https://www.instagram.com/aiprosolutions_slovenija"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-pink-500/20 rounded-2xl px-6 py-4 hover:border-pink-500/40 transition-all duration-300 group"
          >
            <svg className="w-6 h-6 shrink-0 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-txt group-hover:text-pink-500 transition-colors">
                Sledite nam na Instagramu
              </p>
              <p className="text-xs text-txt3">@aiprosolutions_slovenija</p>
            </div>
            <span className="text-pink-500 text-xl group-hover:scale-110 transition-transform shrink-0 ml-auto">
              ♥
            </span>
          </a>
        </div>

        {/* Footer */}
        <div className="text-center mb-8 pt-8 border-t border-border/50">
          <p className="text-sm text-txt3">
            Formatory.si — vse pretvorbe potekajo v vašem brskalniku.
          </p>
          <p className="text-xs text-txt3 mt-1">
            Vaše datoteke nikoli ne zapustijo vašega racunalnika.
          </p>
          <p className="text-xs text-txt3 mt-3">
            Razvil <a href="https://aiprosolutions.si" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">AI Pro Solution</a>
          </p>
        </div>
      </main>
    </>
  );
}
