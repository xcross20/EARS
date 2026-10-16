import { currentActor } from "@/lib/actor";
import { json } from "@/lib/http";
import { reviewInvoice } from "@/lib/review/run";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ invoiceId: string }> }) {
  const actor = await currentActor();
  if (!actor) {
    return json({ error: "unauthenticated" }, 401);
  }
  const { invoiceId } = await context.params;
  const result = await reviewInvoice(actor, invoiceId);
  if (!result.ok) {
    return json({ error: "access_denied" }, 403);
  }
  return json({ review: result.review }, 200);
}
