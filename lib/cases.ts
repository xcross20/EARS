import "server-only";

import type { DecisionEvidence } from "./decision-types";
import { readStateFile, removeStateFile, writeStateFile } from "./state-file";
import type { InvoiceStatus } from "./types";

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

const WORKFLOW_FILE = "workflow.json";
const cases = new Map<string, StoredCase>();
const events: StoredAuditEvent[] = [];
const idempotency = new Map<string, IdempotencyRecord>();
let workflowLoaded = false;

function persistWorkflow(): void {
  writeStateFile(WORKFLOW_FILE, {
    cases: [...cases.values()],
    events,
    idempotency: [...idempotency.entries()],
  });
}

function ensureWorkflowLoaded(): void {
  if (workflowLoaded) {
    return;
  }
  workflowLoaded = true;
  const parsed = readStateFile(WORKFLOW_FILE);
  if (parsed === null) {
    return;
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("EARS state file workflow.json is unreadable");
  }
  const record = parsed as { cases?: unknown; events?: unknown; idempotency?: unknown };
  if (!Array.isArray(record.cases) || !Array.isArray(record.events) || !Array.isArray(record.idempotency)) {
    throw new Error("EARS state file workflow.json is unreadable");
  }
  for (const item of record.cases) {
    const stored = item as StoredCase;
    if (!stored || typeof stored.invoiceId !== "string") {
      throw new Error("EARS state file workflow.json is unreadable");
    }
    cases.set(stored.invoiceId, stored);
  }
  events.push(...(record.events as StoredAuditEvent[]));
  for (const entry of record.idempotency) {
    if (!Array.isArray(entry) || typeof entry[0] !== "string") {
      throw new Error("EARS state file workflow.json is unreadable");
    }
    idempotency.set(entry[0], entry[1] as IdempotencyRecord);
  }
}

export function resetCasesForTests(): void {
  cases.clear();
  events.length = 0;
  idempotency.clear();
  workflowLoaded = true;
  removeStateFile(WORKFLOW_FILE);
}

export function reloadCasesFromDiskForTests(): void {
  cases.clear();
  events.length = 0;
  idempotency.clear();
  workflowLoaded = false;
  ensureWorkflowLoaded();
}

export function workflowStatus(invoiceId: string): InvoiceStatus {
  ensureWorkflowLoaded();
  return cases.get(invoiceId)?.status ?? "awaiting_analyst_review";
}

export function workflowVersion(invoiceId: string): number {
  ensureWorkflowLoaded();
  return cases.get(invoiceId)?.version ?? 0;
}

export function getCase(invoiceId: string): StoredCase | null {
  ensureWorkflowLoaded();
  const stored = cases.get(invoiceId);
  return stored ? structuredClone(stored) : null;
}

export function saveCase(next: StoredCase): void {
  ensureWorkflowLoaded();
  cases.set(next.invoiceId, structuredClone(next));
  persistWorkflow();
}

export function appendAuditEvent(event: StoredAuditEvent): void {
  ensureWorkflowLoaded();
  events.push(structuredClone(event));
  persistWorkflow();
}

export function auditEvents(): readonly StoredAuditEvent[] {
  ensureWorkflowLoaded();
  return events.map((event) => structuredClone(event));
}

export function rememberIdempotency(key: string, record: IdempotencyRecord): void {
  ensureWorkflowLoaded();
  idempotency.set(key, record);
  persistWorkflow();
}

export function idempotencyRecord(key: string): IdempotencyRecord | null {
  ensureWorkflowLoaded();
  const record = idempotency.get(key);
  return record ? { ...record } : null;
}

export function retargetSubmitterForTests(invoiceId: string, employeeId: string): void {
  ensureWorkflowLoaded();
  const stored = cases.get(invoiceId);
  if (!stored) {
    throw new Error(`No case for ${invoiceId}`);
  }
  stored.submittedByEmployeeId = employeeId;
  persistWorkflow();
}
