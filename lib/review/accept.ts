import { reviewHeadline } from "./headline";
import type { AuthorizedPacket, EvidenceReview, ModelDraft, ModelReport, ReviewOutcome } from "./types";

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

function citationIdsFromDraft(draft: ModelDraft): readonly string[] | null {
  if (!draft || typeof draft !== "object" || !Array.isArray(draft.citationIds)) {
    return null;
  }
  if (!draft.citationIds.every((citationId) => typeof citationId === "string")) {
    return null;
  }
  return draft.citationIds;
}

export function reviewFromDraft(
  packet: AuthorizedPacket,
  draft: ModelDraft,
  model: ModelReport,
): EvidenceReview {
  const citationIds = citationIdsFromDraft(draft);
  if (!citationIds) {
    return {
      outcome: "abstain",
      headline: reviewHeadline("abstain"),
      summary: "The model draft was not a usable citation list. No decision was taken from it.",
      isAuthorization: false,
      citations: [],
      checks: packet.checks,
      documentIds: packet.documentIds,
      model,
    };
  }
  const allowed = new Set(packet.citations.map((citation) => citation.citationId));
  const cited = citationIds.filter((citationId) => allowed.has(citationId));
  if (cited.length !== citationIds.length || cited.length === 0) {
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
