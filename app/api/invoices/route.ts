import { currentActor } from "@/lib/actor";
import { authorizeListView } from "@/lib/authz";
import { json } from "@/lib/http";
import { invoicesForView, publicInvoice } from "@/lib/invoices";
import type { ListView } from "@/lib/types";

export const dynamic = "force-dynamic";

const VIEWS: readonly ListView[] = ["assigned", "oversight", "evidence"];

function isListView(value: string | null): value is ListView {
  return VIEWS.some((view) => view === value);
}

export async function GET(request: Request) {
  const actor = await currentActor();
  if (!actor) {
    return json({ error: "unauthenticated" }, 401);
  }
  const viewParam = new URL(request.url).searchParams.get("view");
  if (!isListView(viewParam)) {
    return json({ error: "invalid_view" }, 400);
  }
  const listed = invoicesForView(actor, viewParam);
  if (!authorizeListView(actor, viewParam) || !listed.ok) {
    return json({ error: "access_denied" }, 403);
  }
  return json({ invoices: listed.invoices.map(publicInvoice) }, 200);
}
