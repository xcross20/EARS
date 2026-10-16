import type { ModelReport, ReviewOutcome } from "./review/types";
import type { InvoiceStatus } from "./types";

export type DecisionEvidence = {
  outcome: ReviewOutcome;
  headline: string;
  summary: string;
  isAuthorization: false;
  citationIds: readonly string[];
  sources: readonly { citationId: string; source: string; excerpt: string }[];
  documentIds: readonly string[];
  model: ModelReport;
};

export type PublicDecision = {
  invoiceId: string;
  status: InvoiceStatus;
  version: number;
  submittedByEmployeeId: string | null;
  decidedByEmployeeId: string | null;
  rationale: string | null;
  evidence: DecisionEvidence | null;
  paymentExecuted: false;
};
