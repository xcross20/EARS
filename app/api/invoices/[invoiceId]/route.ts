import { currentActor } from "@/lib/actor";
import { json } from "@/lib/http";
import { caseForActor } from "@/lib/workflow";
import { publicInvoice, readInvoiceForActor } from "@/lib/invoices";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ invoiceId: string }> }) {
  const actor = await currentActor();
  if (!actor) {
    return json({ error: "unauthenticated" }, 401);
  }
  const { invoiceId } = await context.params;
  const result = readInvoiceForActor(actor, invoiceId);
  if (!result.ok) {
    return json({ error: "access_denied" }, 403);
  }
  return json(
    {
      invoice: {
        ...publicInvoice(result.detail.invoice),
        description: result.detail.invoice.description,
        policyTitle: result.detail.policy?.title ?? null,
        policyVersion: result.detail.policy?.version ?? null,
        assigneeDisplayName: result.detail.assignee?.displayName ?? null,
        decision: caseForActor(actor, invoiceId),
      },
    },
    200,
  );
}
