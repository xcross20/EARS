import { authorizeListView, canReadInvoice } from "./authz";
import { workflowStatus } from "./cases";
import { findEmployee, findInvoice, findPolicy, findVendor, invoiceRecords } from "./seed";
import type { Actor, Employee, Invoice, ListView, PolicyMetadata, Vendor } from "./types";

export type RelationState = "consistent" | "missing" | "cross_tenant";

export type InvoiceDetail = {
  invoice: Invoice;
  vendor: Vendor | null;
  policy: PolicyMetadata | null;
  assignee: Employee | null;
  relation: RelationState;
};

export type InvoiceListResult =
  | { ok: true; invoices: readonly Invoice[] }
  | { ok: false; reason: "access_denied" };

export function invoicesForView(actor: Actor, view: ListView): InvoiceListResult {
  if (!authorizeListView(actor, view)) {
    return { ok: false, reason: "access_denied" };
  }
  const invoices = invoiceRecords()
    .filter((invoice) => {
      if (invoice.tenantId !== actor.tenantId) {
        return false;
      }
      if (view === "assigned") {
        return invoice.assignedAnalystEmployeeId === actor.employeeId;
      }
      return true;
    })
    .map((invoice) => ({ ...invoice, status: workflowStatus(invoice.invoiceId) }));
  return { ok: true, invoices };
}

export function policiesForActor(actor: Actor): readonly PolicyMetadata[] {
  const seen = new Set<string>();
  const policies: PolicyMetadata[] = [];
  for (const invoice of invoiceRecords()) {
    if (!canReadInvoice(actor, invoice)) {
      continue;
    }
    const policy = findPolicy(invoice.policyId);
    if (!policy || policy.tenantId !== actor.tenantId || seen.has(policy.policyId)) {
      continue;
    }
    seen.add(policy.policyId);
    policies.push(policy);
  }
  return policies;
}

function sameTenant<T extends { tenantId: string }>(invoice: Invoice, record: T | undefined): T | null {
  if (!record || record.tenantId !== invoice.tenantId) {
    return null;
  }
  return record;
}

export function readInvoiceForActor(
  actor: Actor | null,
  invoiceId: string,
): { ok: true; detail: InvoiceDetail } | { ok: false; reason: "unauthenticated" | "access_denied" } {
  if (!actor) {
    return { ok: false, reason: "unauthenticated" };
  }
  const invoice = findInvoice(invoiceId);
  if (!invoice || !canReadInvoice(actor, invoice)) {
    return { ok: false, reason: "access_denied" };
  }
  const vendorRecord = findVendor(invoice.vendorId);
  const policyRecord = findPolicy(invoice.policyId);
  const assigneeRecord = findEmployee(invoice.assignedAnalystEmployeeId);
  const vendor = sameTenant(invoice, vendorRecord);
  const policy = sameTenant(invoice, policyRecord);
  const assignee = sameTenant(invoice, assigneeRecord);
  const foreign = Boolean(
    (vendorRecord && !vendor) || (policyRecord && !policy) || (assigneeRecord && !assignee),
  );
  const relation: RelationState = foreign
    ? "cross_tenant"
    : !vendor || !policy || !assignee
      ? "missing"
      : "consistent";
  const visibleInvoice: Invoice = { ...invoice, status: workflowStatus(invoice.invoiceId) };
  if (vendorRecord && !vendor) {
    visibleInvoice.vendorId = "redacted";
  }
  if (policyRecord && !policy) {
    visibleInvoice.policyId = "redacted";
  }
  if (assigneeRecord && !assignee) {
    visibleInvoice.assignedAnalystEmployeeId = "redacted";
  }
  return { ok: true, detail: { invoice: visibleInvoice, vendor, policy, assignee, relation } };
}

export function sameTenantInvoiceNumberCount(invoice: Invoice): number {
  return invoiceRecords().filter(
    (item) => item.tenantId === invoice.tenantId && item.invoiceNumber === invoice.invoiceNumber,
  ).length;
}

export function vendorLegalName(invoice: Invoice): string {
  const vendor = findVendor(invoice.vendorId);
  if (!vendor || vendor.tenantId !== invoice.tenantId) {
    return "Vendor record unavailable";
  }
  return vendor.legalName;
}

export function publicInvoice(invoice: Invoice) {
  return {
    invoiceId: invoice.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    amountCents: invoice.amountCents,
    currency: invoice.currency,
    status: invoice.status,
    vendorLegalName: vendorLegalName(invoice),
    issuedOn: invoice.issuedOn,
    dueOn: invoice.dueOn,
  };
}
