import Header from "@/components/Header";
import ToolCard from "@/components/ToolCard";
import ParticleBackground from "@/components/ParticleBackground";
import { TOOLS } from "@/lib/tools";

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
        <div className="grid grid-cols-3 gap-6 mb-16 max-w-lg mx-auto">
          <div className="text-center">
            <p className="text-3xl font-bold text-txt">100%</p>
            <p className="text-xs text-txt2 mt-1">zasebno</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-txt">0</p>
            <p className="text-xs text-txt2 mt-1">nalaganj na strežnik</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-txt">9+</p>
            <p className="text-xs text-txt2 mt-1">orodij</p>
          </div>
        </div>

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

        {/* Footer */}
        <div className="text-center mt-16 mb-8 pt-8 border-t border-border/50">
          <p className="text-sm text-txt3">
            Formatory.si — vse pretvorbe potekajo v vašem brskalniku.
          </p>
          <p className="text-xs text-txt3 mt-1">
            Vaše datoteke nikoli ne zapustijo vašega racunalnika.
          </p>
        </div>
      </main>
    </>
  );
}
