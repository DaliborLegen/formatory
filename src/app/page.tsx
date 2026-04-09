import Header from "@/components/Header";
import ToolCard from "@/components/ToolCard";
import ParticleBackground from "@/components/ParticleBackground";
import { TOOLS } from "@/lib/tools";

export default function Home() {
  const totalTools = TOOLS.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <>
      <ParticleBackground />
      <Header />
      <main className="relative z-10 flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-20">
          <div className="max-w-2xl">
            <div className="badge bg-accent-soft text-accent mb-6 animate-fade-up" style={{ animationDelay: "0s" }}>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              100% zasebno — vse v brskalniku
            </div>

            <h1
              className="text-[clamp(2.2rem,5vw,3.5rem)] font-extrabold text-txt leading-[1.1] tracking-tight animate-fade-up"
              style={{ animationDelay: "0.05s" }}
            >
              Pretvori vse na{" "}
              <span className="text-accent">enem mestu</span>
            </h1>

            <p
              className="text-base sm:text-lg text-txt2 mt-5 leading-relaxed max-w-lg animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              Dokumenti, slike, video — brezplacno spletno orodje za pretvorbo
              datotek. Vaše datoteke nikoli ne zapustijo racunalnika.
            </p>
          </div>

          {/* Stats */}
          <div
            className="flex flex-wrap gap-10 mt-12 animate-fade-up"
            style={{ animationDelay: "0.15s" }}
          >
            {[
              { value: `${totalTools}`, label: "orodij" },
              { value: "0", label: "nalaganj na strežnik" },
              { value: "100%", label: "zasebno" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl sm:text-4xl font-extrabold text-txt font-display tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs text-txt3 mt-1 font-medium uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-border/60" />

        {/* Tools grid */}
        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-14">
            {TOOLS.map((section, sIdx) => (
              <div
                key={section.section}
                className="animate-fade-up"
                style={{ animationDelay: `${0.05 * sIdx}s` }}
              >
                <h2 className="relative pl-4 section-bar text-[13px] font-bold text-txt uppercase tracking-[0.08em] mb-4">
                  {section.section}
                </h2>
                <div className="grid gap-2">
                  {section.items.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 bg-bg2/50">
          <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">F</span>
              </div>
              <span className="text-sm font-semibold text-txt">Formatory.si</span>
            </div>
            <p className="text-xs text-txt3 text-center sm:text-right">
              Vse pretvorbe potekajo v vašem brskalniku. Vaše datoteke nikoli ne zapustijo racunalnika.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
