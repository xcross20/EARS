import "server-only";

import type { InvoiceStatus } from "./types";
import type { DecisionEvidence } from "./decision-types";

export type StoredCase = {
  invoiceId: string;
  tenantId: string;
  status: InvoiceStatus;
  version: number;
  submittedByEmployeeId: string | null;
  submittedAt: string | null;
  decidedByEmployeeId: string | null;
  decidedAt: string | null;
  rationale: string | null;
  evidence: DecisionEvidence | null;
};

export type StoredAuditEvent = {
  eventId: string;
  tenantId: string;
  invoiceId: string;
  actorEmployeeId: string;
  action: "submit" | "approve" | "reject";
  at: string;
  outcome: string;
  rationale: string | null;
  evidence: DecisionEvidence | null;
  version: number;
};

type IdempotencyRecord = {
  actorEmployeeId: string;
  invoiceId: string;
  action: "submit" | "approve" | "reject";
  eventId: string;
};

const cases = new Map<string, StoredCase>();
const events: StoredAuditEvent[] = [];
const idempotency = new Map<string, IdempotencyRecord>();

export function resetCasesForTests(): void {
  cases.clear();
  events.length = 0;
  idempotency.clear();
}

export function workflowStatus(invoiceId: string): InvoiceStatus {
  return cases.get(invoiceId)?.status ?? "awaiting_analyst_review";
}

export function workflowVersion(invoiceId: string): number {
  return cases.get(invoiceId)?.version ?? 0;
}

export function getCase(invoiceId: string): StoredCase | null {
  const stored = cases.get(invoiceId);
  return stored ? structuredClone(stored) : null;
}

export function saveCase(next: StoredCase): void {
  cases.set(next.invoiceId, structuredClone(next));
}

export function appendAuditEvent(event: StoredAuditEvent): void {
  events.push(structuredClone(event));
}

export function auditEvents(): readonly StoredAuditEvent[] {
  return events.map((event) => structuredClone(event));
}

export function rememberIdempotency(key: string, record: IdempotencyRecord): void {
  idempotency.set(key, record);
}

export function idempotencyRecord(key: string): IdempotencyRecord | null {
  const record = idempotency.get(key);
  return record ? { ...record } : null;
}

export function retargetSubmitterForTests(invoiceId: string, employeeId: string): void {
  const stored = cases.get(invoiceId);
  if (!stored) {
    throw new Error(`No case for ${invoiceId}`);
  }
  stored.submittedByEmployeeId = employeeId;
}
