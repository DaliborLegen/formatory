import Header from "@/components/Header";
import ToolCard from "@/components/ToolCard";
import { TOOLS } from "@/lib/tools";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-txt mb-2">Formatory</h1>
          <p className="text-sm text-txt2">
            Dokumenti, slike, video — pretvori vse na enem mestu. Brezplacno.
          </p>
        </div>

        {/* Tool sections */}
        {TOOLS.map((section) => (
          <div key={section.section} className="mb-6">
            <h2 className="text-xs font-semibold text-txt2 uppercase tracking-wider px-4 mb-2">
              {section.section}
            </h2>
            <div className="bg-surface rounded-xl overflow-hidden border border-divider">
              {section.items.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <p className="text-center text-xs text-txt3 mt-8 mb-4">
          Formatory.si — vse pretvorbe potekajo v vašem brskalniku. Vaše datoteke nikoli ne zapustijo vašega racunalnika.
        </p>
      </main>
    </>
  );
}
