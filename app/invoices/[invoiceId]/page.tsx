import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { DeniedState } from "@/components/DeniedState";
import { InvoiceDetail } from "@/components/InvoiceDetail";
import { currentActor } from "@/lib/actor";
import { readInvoiceForActor } from "@/lib/invoices";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const actor = await currentActor();
  if (!actor) {
    redirect("/");
  }
  const { invoiceId } = await params;
  const result = readInvoiceForActor(actor, invoiceId);
  return (
    <AppShell actor={actor}>
      {result.ok ? <InvoiceDetail actor={actor} detail={result.detail} /> : <DeniedState actor={actor} />}
    </AppShell>
  );
}
