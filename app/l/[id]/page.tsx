import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getLead } from "@/lib/leads";
import { WaitAndTalk } from "./wait-and-talk";

async function Greeting({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();
  const firstName = lead.form.name.split(" ")[0];
  return (
    <>
      <div className="doc-head">
        <p className="eyebrow">Quase lá</p>
        <h1>
          Obrigado, {firstName}
          <span className="dot">.</span>
        </h1>
        <p className="lede">
          Estamos olhando a {lead.form.company} para a conversa ir direto ao ponto. Quando terminar, é só clicar e falar.
        </p>
      </div>
      <WaitAndTalk id={lead.id} initialStatus={lead.status} />
    </>
  );
}

export default function LeadPage({ params }: PageProps<"/l/[id]">) {
  return (
    <main>
      <Suspense>
        <Greeting params={params} />
      </Suspense>
    </main>
  );
}
