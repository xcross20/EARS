import { currentActor } from "@/lib/actor";
import { json } from "@/lib/http";
import { decideInvoice, normalizeExpectedVersion, normalizeRationale } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ invoiceId: string }> }) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const expectedVersion = normalizeExpectedVersion(record.expectedVersion);
  const rationale = normalizeRationale(record.rationale);
  const outcome = record.outcome === "approve" || record.outcome === "reject" ? record.outcome : null;
  if (expectedVersion === null || rationale === null || !outcome) {
    return json({ error: "invalid_body" }, 400);
  }
  const { invoiceId } = await context.params;
  const result = decideInvoice(
    await currentActor(),
    invoiceId,
    { expectedVersion, outcome, rationale },
    request.headers.get("idempotency-key"),
    Date.now(),
  );
  if (!result.ok) {
    return json(result.body, result.httpStatus);
  }
  return json({ decision: result.decision, idempotentReplay: result.idempotentReplay }, 200);
}
