import { currentActor } from "@/lib/actor";
import { json } from "@/lib/http";
import { normalizeExpectedVersion, submitAssignedInvoice } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ invoiceId: string }> }) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  const expectedVersion = normalizeExpectedVersion(
    typeof body === "object" && body !== null ? (body as { expectedVersion?: unknown }).expectedVersion : null,
  );
  if (expectedVersion === null) {
    return json({ error: "invalid_body" }, 400);
  }
  const { invoiceId } = await context.params;
  const result = await submitAssignedInvoice(
    await currentActor(),
    invoiceId,
    expectedVersion,
    request.headers.get("idempotency-key"),
    Date.now(),
  );
  if (!result.ok) {
    return json(result.body, result.httpStatus);
  }
  return json({ decision: result.decision, idempotentReplay: result.idempotentReplay }, 200);
}
