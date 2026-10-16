import { readInvoiceForActor } from "../invoices";
import { deterministicDraft, reviewFromDraft } from "./accept";
import { reviewHeadline } from "./headline";
import { buildAuthorizedPacket } from "./packet";
import type { Actor } from "../types";
import type { EvidenceReview, ReviewModel } from "./types";
import { xaiReviewModel } from "./xai";

export function selectReviewModel(env: NodeJS.ProcessEnv = process.env): ReviewModel {
  const apiKey = env.XAI_API_KEY;
  if (apiKey && apiKey.length >= 16) {
    return xaiReviewModel(apiKey);
  }
  return {
    provider: "deterministic",
    async draft(packet) {
      return deterministicDraft(packet);
    },
  };
}

function abstain(documentIds: readonly string[] = []): EvidenceReview {
  return {
    outcome: "abstain",
    headline: reviewHeadline("abstain"),
    summary: "The mock ERP or the authorized policy did not supply usable evidence. No vendor status was invented.",
    isAuthorization: false,
    citations: [],
    checks: [],
    documentIds,
    model: { provider: "deterministic", called: false },
  };
}

export async function reviewInvoice(
  actor: Actor | null,
  invoiceId: string,
  model: ReviewModel = selectReviewModel(),
): Promise<{ ok: true; review: EvidenceReview } | { ok: false; reason: "unauthenticated" | "access_denied" }> {
  if (!actor) {
    return { ok: false, reason: "unauthenticated" };
  }
  const readable = readInvoiceForActor(actor, invoiceId);
  if (!readable.ok) {
    return { ok: false, reason: "access_denied" };
  }
  const built = buildAuthorizedPacket(actor, invoiceId);
  if (!built.ok) {
    if (built.reason === "access_denied") {
      return { ok: false, reason: "access_denied" };
    }
    return { ok: true, review: abstain([readable.detail.invoice.invoiceId]) };
  }
  let draft = null;
  let called = false;
  try {
    draft = await model.draft(built.packet);
    called = model.provider !== "deterministic";
  } catch {
    draft = null;
    called = false;
  }
  if (!draft) {
    draft = deterministicDraft(built.packet);
    return {
      ok: true,
      review: reviewFromDraft(built.packet, draft, { provider: "deterministic", called: false }),
    };
  }
  return {
    ok: true,
    review: reviewFromDraft(built.packet, draft, { provider: model.provider, called }),
  };
}
