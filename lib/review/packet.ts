import { lookupVendorForActor } from "../erp";
import { policiesForActor, readInvoiceForActor, sameTenantInvoiceNumberCount } from "../invoices";
import type { Actor, PolicyMetadata } from "../types";
import type { AuthorizedPacket, ReviewCheck, ReviewCitation } from "./types";

const USD_AMOUNT = /(\d+)\s*USD/;

export function thresholdCents(policy: PolicyMetadata): number | null {
  const match = USD_AMOUNT.exec(policy.thresholdNote);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 100;
}

export function buildAuthorizedPacket(
  actor: Actor,
  invoiceId: string,
): { ok: true; packet: AuthorizedPacket } | { ok: false; reason: "access_denied" | "erp_unavailable" | "not_found" } {
  const readable = readInvoiceForActor(actor, invoiceId);
  if (!readable.ok) {
    return { ok: false, reason: "access_denied" };
  }
  const { invoice, policy, relation } = readable.detail;
  if (relation === "cross_tenant" || !policy || policy.tenantId !== invoice.tenantId) {
    return { ok: false, reason: relation === "missing" ? "not_found" : "access_denied" };
  }
  const allowedPolicies = policiesForActor(actor);
  if (!allowedPolicies.some((item) => item.policyId === policy.policyId)) {
    return { ok: false, reason: "access_denied" };
  }
  const erp = lookupVendorForActor(actor, invoice.vendorId);
  if (!erp.ok) {
    return { ok: false, reason: erp.reason };
  }
  const policyCitation: ReviewCitation = {
    citationId: `policy:${policy.policyId}`,
    source: `${policy.title} ${policy.version}`,
    excerpt: policy.thresholdNote,
  };
  const erpCitation: ReviewCitation = {
    citationId: erp.citationId,
    source: "Mock ERP vendor record",
    excerpt: `${erp.legalName} is ${erp.status}.`,
  };
  const limit = thresholdCents(policy);
  const checks: ReviewCheck[] = [
    {
      checkId: "threshold",
      passed: limit !== null && invoice.amountCents < limit,
      detail:
        limit === null
          ? "The authorized policy has no numeric USD threshold."
          : `Invoice amount is ${invoice.amountCents} cents. The authorized policy notes a review at ${limit} cents.`,
    },
    {
      checkId: "duplicate_invoice_number",
      passed: sameTenantInvoiceNumberCount(invoice) === 1,
      detail:
        sameTenantInvoiceNumberCount(invoice) === 1
          ? "No other invoice in this tenant uses this invoice number."
          : "Another invoice in this tenant uses this invoice number.",
    },
    {
      checkId: "erp_vendor",
      passed: true,
      detail: erpCitation.excerpt,
    },
  ];
  return {
    ok: true,
    packet: {
      invoiceId: invoice.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      description: invoice.description,
      citations: [policyCitation, erpCitation],
      checks,
      documentIds: [policy.policyId, erp.vendorId, invoice.invoiceId],
    },
  };
}
