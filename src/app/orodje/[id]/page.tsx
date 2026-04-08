import { TOOLS } from "@/lib/tools";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
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
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <ToolPageClient tool={tool} />
      </main>
    </>
  );
}
