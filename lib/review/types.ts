export type ReviewOutcome = "refer_to_manager" | "hold_duplicate" | "no_exception_noted" | "abstain";

export type ReviewCitation = {
  citationId: string;
  source: string;
  excerpt: string;
};

export type ReviewCheck = {
  checkId: string;
  passed: boolean;
  detail: string;
};

export type AuthorizedPacket = {
  invoiceId: string;
  invoiceNumber: string;
  amountCents: number;
  currency: "USD";
  description: string;
  citations: readonly ReviewCitation[];
  checks: readonly ReviewCheck[];
  documentIds: readonly string[];
};

export type ModelDraft = {
  summary: string;
  citationIds: readonly string[];
};

export type ReviewModel = {
  provider: "deterministic" | "xai" | "scripted";
  draft(packet: AuthorizedPacket): Promise<ModelDraft | null>;
};

export type EvidenceReview = {
  outcome: ReviewOutcome;
  headline: string;
  summary: string;
  isAuthorization: false;
  citations: readonly ReviewCitation[];
  checks: readonly ReviewCheck[];
  documentIds: readonly string[];
  model: { provider: ReviewModel["provider"]; called: boolean };
};
