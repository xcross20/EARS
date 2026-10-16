import { readInvoiceForActor } from "../invoices";
import { deterministicDraft, reviewFromDraft } from "./accept";
import { reviewHeadline } from "./headline";
import { buildAuthorizedPacket } from "./packet";
import type { Actor } from "../types";
import type { EvidenceReview, ModelDraft, ModelReport, ReviewModel } from "./types";
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
    model: { provider: "deterministic", called: false, mode: "deterministic" },
  };
}

function reportFor(model: ReviewModel, draft: ModelDraft | null): ModelReport {
  if (model.provider === "deterministic") {
    return { provider: "deterministic", called: false, mode: "deterministic" };
  }
  if (!draft) {
    return { provider: "deterministic", called: false, mode: "provider_fallback" };
  }
  return { provider: model.provider, called: true, mode: "provider" };
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
  let draft: ModelDraft | null = null;
  try {
    draft = await model.draft(built.packet);
  } catch {
    draft = null;
  }
  const report = reportFor(model, draft);
  if (!draft) {
    draft = deterministicDraft(built.packet);
  }
  try {
    return { ok: true, review: reviewFromDraft(built.packet, draft, report) };
  } catch {
    return {
      ok: true,
      review: {
        ...abstain(built.packet.documentIds),
        summary: "The model draft was not a usable citation list. No decision was taken from it.",
        model: report.mode === "deterministic" ? report : { ...report, mode: "provider_fallback", called: false },
      },
    };
  }
}
