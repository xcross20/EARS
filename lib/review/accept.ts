import { reviewHeadline } from "./headline";
import type { AuthorizedPacket, EvidenceReview, ModelDraft, ReviewModel, ReviewOutcome } from "./types";

function outcomeFromChecks(packet: AuthorizedPacket): ReviewOutcome {
  const threshold = packet.checks.find((check) => check.checkId === "threshold");
  const duplicate = packet.checks.find((check) => check.checkId === "duplicate_invoice_number");
  if (!threshold?.passed && threshold?.detail.includes("no numeric")) {
    return "abstain";
  }
  if (duplicate && !duplicate.passed) {
    return "hold_duplicate";
  }
  if (threshold && !threshold.passed) {
    return "refer_to_manager";
  }
  return "no_exception_noted";
}

export function deterministicDraft(packet: AuthorizedPacket): ModelDraft {
  const outcome = outcomeFromChecks(packet);
  return {
    summary: reviewHeadline(outcome),
    citationIds: packet.citations.map((citation) => citation.citationId),
  };
}

export function reviewFromDraft(
  packet: AuthorizedPacket,
  draft: ModelDraft,
  model: { provider: ReviewModel["provider"]; called: boolean },
): EvidenceReview {
  const allowed = new Set(packet.citations.map((citation) => citation.citationId));
  const cited = draft.citationIds.filter((citationId) => allowed.has(citationId));
  if (cited.length !== draft.citationIds.length || cited.length === 0) {
    return {
      outcome: "abstain",
      headline: reviewHeadline("abstain"),
      summary: "The draft cited evidence that was not in the authorized packet.",
      isAuthorization: false,
      citations: [],
      checks: packet.checks,
      documentIds: packet.documentIds,
      model,
    };
  }
  const outcome = outcomeFromChecks(packet);
  return {
    outcome,
    headline: reviewHeadline(outcome),
    summary: reviewHeadline(outcome),
    isAuthorization: false,
    citations: packet.citations.filter((citation) => cited.includes(citation.citationId)),
    checks: packet.checks,
    documentIds: packet.documentIds,
    model,
  };
}
