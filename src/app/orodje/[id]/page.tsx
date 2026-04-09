import { TOOLS } from "@/lib/tools";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import ParticleBackground from "@/components/ParticleBackground";
import ToolPageClient from "./ToolPageClient";

export function generateStaticParams() {
  return TOOLS.flatMap((s) => s.items.map((t) => ({ id: t.id })));
}

export default async function ToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tool = TOOLS.flatMap((s) => s.items).find((t) => t.id === id);
  if (!tool) notFound();

  return (
    <>
      <ParticleBackground />
      <Header />
      <main className="relative z-10 flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <ToolPageClient tool={tool} />
      </main>
    </>
  );
}
