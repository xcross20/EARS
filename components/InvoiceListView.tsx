import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { DeniedState } from "@/components/DeniedState";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { InvoiceTable } from "@/components/InvoiceTable";
import { currentActor } from "@/lib/actor";
import { authorizeListView, listViewTitle } from "@/lib/authz";
import { DEMO_LOAD_DELAY_MS, shouldDelayDemoLoad, shouldShowDemoFault } from "@/lib/faults";
import { invoicesForView } from "@/lib/invoices";
import type { ListView } from "@/lib/types";

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function InvoiceListView({
  view,
  searchParams,
}: {
  view: ListView;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await currentActor();
  if (!actor) {
    redirect("/");
  }
  const params = await searchParams;
  const demoState = firstString(params.demoState);
  if (shouldDelayDemoLoad(demoState, process.env.EARS_ALLOW_DEMO_FAULTS)) {
    await new Promise((resolve) => setTimeout(resolve, DEMO_LOAD_DELAY_MS));
  }
  return (
    <AppShell actor={actor}>
      {shouldShowDemoFault(demoState, process.env.EARS_ALLOW_DEMO_FAULTS) ? (
        <ErrorState />
      ) : !authorizeListView(actor, view) ? (
        <DeniedState actor={actor} />
      ) : (
        <section>
          <h1>{listViewTitle(view)}</h1>
          <InvoiceListBody actor={actor} view={view} />
        </section>
      )}
    </AppShell>
  );
}

function InvoiceListBody({
  actor,
  view,
}: {
  actor: NonNullable<Awaited<ReturnType<typeof currentActor>>>;
  view: ListView;
}) {
  const listed = invoicesForView(actor, view);
  if (!listed.ok) {
    return <DeniedState actor={actor} />;
  }
  if (listed.invoices.length === 0) {
    return <EmptyState />;
  }
  return <InvoiceTable invoices={listed.invoices} />;
}
