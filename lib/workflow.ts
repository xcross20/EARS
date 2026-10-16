import { randomBytes } from "node:crypto";

import "server-only";

import {
  appendAuditEvent,
  auditEvents,
  getCase,
  idempotencyRecord,
  rememberIdempotency,
  saveCase,
  workflowVersion,
  type StoredAuditEvent,
  type StoredCase,
} from "./cases";
import type { DecisionEvidence, PublicDecision } from "./decision-types";
import { readInvoiceForActor } from "./invoices";
import { reviewInvoice } from "./review/run";
import type { EvidenceReview, ReviewOutcome } from "./review/types";
import { findEmployee, findInvoice } from "./seed";
import type { Actor } from "./types";

const RATIONALE_MAX = 500;
const SUBMITTABLE: readonly ReviewOutcome[] = ["refer_to_manager", "no_exception_noted"];

export type WorkflowFailure = {
  ok: false;
  httpStatus: 401 | 403 | 409;
  body: { error: string; operation?: "submit" | "decide" | "pay"; outcome?: ReviewOutcome };
};

export type WorkflowSuccess = {
  ok: true;
  httpStatus: 200;
  decision: PublicDecision;
  idempotentReplay: boolean;
};

function eventId(): string {
  return `evt_${randomBytes(9).toString("base64url")}`;
}

function evidenceFromReview(review: EvidenceReview): DecisionEvidence {
  return {
    outcome: review.outcome,
    headline: review.headline,
    summary: review.summary,
    isAuthorization: false,
    citationIds: review.citations.map((citation) => citation.citationId),
    sources: review.citations.map((citation) => ({
      citationId: citation.citationId,
      source: citation.source,
      excerpt: citation.excerpt,
    })),
    documentIds: [...review.documentIds],
    model: review.model,
  };
}

function toPublic(stored: StoredCase): PublicDecision {
  return {
    invoiceId: stored.invoiceId,
    status: stored.status,
    version: stored.version,
    submittedByEmployeeId: stored.submittedByEmployeeId,
    decidedByEmployeeId: stored.decidedByEmployeeId,
    rationale: stored.rationale,
    evidence: stored.evidence,
    paymentExecuted: false,
  };
}

function blankCase(invoiceId: string, tenantId: string): StoredCase {
  return {
    invoiceId,
    tenantId,
    status: "awaiting_analyst_review",
    version: 0,
    submittedByEmployeeId: null,
    submittedAt: null,
    decidedByEmployeeId: null,
    decidedAt: null,
    rationale: null,
    evidence: null,
  };
}

export function normalizeRationale(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const rationale = value.trim();
  if (rationale.length === 0 || rationale.length > RATIONALE_MAX || rationale.includes("\u0000")) {
    return null;
  }
  return rationale;
}

export function normalizeExpectedVersion(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return null;
  }
  return value;
}

function idempotencyKey(actor: Actor, action: StoredAuditEvent["action"], header: string | null): string | null {
  if (!header) {
    return null;
  }
  const trimmed = header.trim();
  if (trimmed.length === 0 || trimmed.length > 80) {
    return null;
  }
  return `${actor.employeeId}:${action}:${trimmed}`;
}

function replayFromKey(
  actor: Actor,
  invoiceId: string,
  action: StoredAuditEvent["action"],
  header: string | null,
): WorkflowSuccess | WorkflowFailure | null {
  const key = idempotencyKey(actor, action, header);
  if (!key) {
    return null;
  }
  const record = idempotencyRecord(key);
  if (!record) {
    return null;
  }
  if (record.actorEmployeeId !== actor.employeeId || record.invoiceId !== invoiceId || record.action !== action) {
    return { ok: false, httpStatus: 409, body: { error: "idempotency_conflict" } };
  }
  const stored = getCase(invoiceId);
  if (!stored) {
    return { ok: false, httpStatus: 409, body: { error: "idempotency_conflict" } };
  }
  return { ok: true, httpStatus: 200, decision: toPublic(stored), idempotentReplay: true };
}

function remember(actor: Actor, action: StoredAuditEvent["action"], header: string | null, invoiceId: string, id: string) {
  const key = idempotencyKey(actor, action, header);
  if (key && !idempotencyRecord(key)) {
    rememberIdempotency(key, { actorEmployeeId: actor.employeeId, invoiceId, action, eventId: id });
  }
}

export async function submitAssignedInvoice(
  actor: Actor | null,
  invoiceId: string,
  expectedVersion: number,
  idempotencyHeader: string | null,
  nowMs: number,
): Promise<WorkflowSuccess | WorkflowFailure> {
  if (!actor) {
    return { ok: false, httpStatus: 401, body: { error: "unauthenticated" } };
  }
  const readable = readInvoiceForActor(actor, invoiceId);
  if (!readable.ok || readable.detail.relation === "cross_tenant") {
    return { ok: false, httpStatus: 403, body: { error: "access_denied" } };
  }
  if (actor.role !== "analyst" || readable.detail.invoice.assignedAnalystEmployeeId !== actor.employeeId) {
    return { ok: false, httpStatus: 403, body: { error: "operation_forbidden", operation: "submit" } };
  }
  const replay = replayFromKey(actor, invoiceId, "submit", idempotencyHeader);
  if (replay) {
    return replay;
  }
  const current = getCase(invoiceId) ?? blankCase(invoiceId, actor.tenantId);
  if (current.status === "pending_manager_decision" && current.submittedByEmployeeId === actor.employeeId) {
    return { ok: true, httpStatus: 200, decision: toPublic(current), idempotentReplay: true };
  }
  if (current.status !== "awaiting_analyst_review") {
    return { ok: false, httpStatus: 409, body: { error: "illegal_transition" } };
  }
  if (current.version !== expectedVersion) {
    return { ok: false, httpStatus: 409, body: { error: "stale_state" } };
  }
  const review = await reviewInvoice(actor, invoiceId);
  const afterReview = getCase(invoiceId) ?? current;
  if (afterReview.status === "pending_manager_decision" && afterReview.submittedByEmployeeId === actor.employeeId) {
    return { ok: true, httpStatus: 200, decision: toPublic(afterReview), idempotentReplay: true };
  }
  if (afterReview.version !== expectedVersion || afterReview.status !== "awaiting_analyst_review") {
    return { ok: false, httpStatus: 409, body: { error: "stale_state" } };
  }
  if (!review.ok) {
    return { ok: false, httpStatus: 403, body: { error: "access_denied" } };
  }
  if (!SUBMITTABLE.includes(review.review.outcome)) {
    return { ok: false, httpStatus: 409, body: { error: "not_submittable", outcome: review.review.outcome } };
  }
  const at = new Date(nowMs).toISOString();
  const id = eventId();
  const evidence = evidenceFromReview(review.review);
  const next: StoredCase = {
    ...afterReview,
    status: "pending_manager_decision",
    version: afterReview.version + 1,
    submittedByEmployeeId: actor.employeeId,
    submittedAt: at,
    evidence,
  };
  saveCase(next);
  appendAuditEvent({
    eventId: id,
    tenantId: actor.tenantId,
    invoiceId,
    actorEmployeeId: actor.employeeId,
    action: "submit",
    at,
    outcome: evidence.outcome,
    rationale: null,
    evidence,
    version: next.version,
  });
  remember(actor, "submit", idempotencyHeader, invoiceId, id);
  return { ok: true, httpStatus: 200, decision: toPublic(next), idempotentReplay: false };
}

export function decideInvoice(
  actor: Actor | null,
  invoiceId: string,
  input: { expectedVersion: number; outcome: "approve" | "reject"; rationale: string },
  idempotencyHeader: string | null,
  nowMs: number,
): WorkflowSuccess | WorkflowFailure {
  if (!actor) {
    return { ok: false, httpStatus: 401, body: { error: "unauthenticated" } };
  }
  const readable = readInvoiceForActor(actor, invoiceId);
  if (!readable.ok || readable.detail.relation === "cross_tenant") {
    return { ok: false, httpStatus: 403, body: { error: "access_denied" } };
  }
  if (actor.role !== "manager" || actor.tenantId !== readable.detail.invoice.tenantId) {
    return { ok: false, httpStatus: 403, body: { error: "operation_forbidden", operation: "decide" } };
  }
  const action = input.outcome === "approve" ? "approve" : "reject";
  const replay = replayFromKey(actor, invoiceId, action, idempotencyHeader);
  if (replay) {
    return replay;
  }
  const current = getCase(invoiceId) ?? blankCase(invoiceId, readable.detail.invoice.tenantId);
  const target = input.outcome === "approve" ? "manager_approved" : "manager_rejected";
  if (current.status === target) {
    return { ok: true, httpStatus: 200, decision: toPublic(current), idempotentReplay: true };
  }
  if (current.status === "manager_approved" || current.status === "manager_rejected") {
    return { ok: false, httpStatus: 409, body: { error: "illegal_transition" } };
  }
  if (current.status !== "pending_manager_decision") {
    return { ok: false, httpStatus: 409, body: { error: "illegal_transition" } };
  }
  if (current.submittedByEmployeeId === actor.employeeId) {
    return { ok: false, httpStatus: 403, body: { error: "operation_forbidden", operation: "decide" } };
  }
  if (current.version !== input.expectedVersion) {
    return { ok: false, httpStatus: 409, body: { error: "stale_state" } };
  }
  const at = new Date(nowMs).toISOString();
  const id = eventId();
  const next: StoredCase = {
    ...current,
    status: target,
    version: current.version + 1,
    decidedByEmployeeId: actor.employeeId,
    decidedAt: at,
    rationale: input.rationale,
  };
  saveCase(next);
  appendAuditEvent({
    eventId: id,
    tenantId: actor.tenantId,
    invoiceId,
    actorEmployeeId: actor.employeeId,
    action,
    at,
    outcome: target,
    rationale: input.rationale,
    evidence: current.evidence,
    version: next.version,
  });
  remember(actor, action, idempotencyHeader, invoiceId, id);
  return { ok: true, httpStatus: 200, decision: toPublic(next), idempotentReplay: false };
}

export type VisibleAuditEvent = StoredAuditEvent & {
  actorDisplayName: string;
  invoiceNumber: string;
};

export function listAuditForActor(
  actor: Actor | null,
): { ok: true; events: VisibleAuditEvent[] } | { ok: false; httpStatus: 401 | 403; body: { error: string } } {
  if (!actor) {
    return { ok: false, httpStatus: 401, body: { error: "unauthenticated" } };
  }
  if (actor.role !== "auditor") {
    return { ok: false, httpStatus: 403, body: { error: "access_denied" } };
  }
  const visible = auditEvents()
    .filter((event) => event.tenantId === actor.tenantId)
    .map((event) => {
      const employee = findEmployee(event.actorEmployeeId);
      const invoice = findInvoice(event.invoiceId);
      return {
        ...event,
        actorDisplayName:
          employee && employee.tenantId === actor.tenantId ? employee.displayName : "Unknown actor",
        invoiceNumber: invoice && invoice.tenantId === actor.tenantId ? invoice.invoiceNumber : event.invoiceId,
      };
    });
  return { ok: true, events: visible };
}

export function caseForActor(actor: Actor, invoiceId: string): PublicDecision | null {
  const readable = readInvoiceForActor(actor, invoiceId);
  if (!readable.ok || readable.detail.relation === "cross_tenant") {
    return null;
  }
  const stored = getCase(invoiceId);
  if (!stored || stored.tenantId !== actor.tenantId) {
    return {
      invoiceId,
      status: "awaiting_analyst_review",
      version: workflowVersion(invoiceId),
      submittedByEmployeeId: null,
      decidedByEmployeeId: null,
      rationale: null,
      evidence: null,
      paymentExecuted: false,
    };
  }
  return toPublic(stored);
}
