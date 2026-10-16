import { authorizeListView, canReadInvoice } from "./authz";
import { findEmployee, findInvoice, findPolicy, findVendor, invoiceRecords } from "./seed";
import type { Actor, Employee, Invoice, ListView, PolicyMetadata, Vendor } from "./types";

export type InvoiceDetail = {
  invoice: Invoice;
  vendor: Vendor;
  policy: PolicyMetadata;
  assignee: Employee;
};

export type InvoiceListResult =
  | { ok: true; invoices: readonly Invoice[] }
  | { ok: false; reason: "access_denied" };

export function invoicesForView(actor: Actor, view: ListView): InvoiceListResult {
  if (!authorizeListView(actor, view)) {
    return { ok: false, reason: "access_denied" };
  }
  const invoices = invoiceRecords().filter((invoice) => {
    if (invoice.tenantId !== actor.tenantId) {
      return false;
    }
    if (view === "assigned") {
      return invoice.assignedAnalystEmployeeId === actor.employeeId;
    }
    return true;
  });
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
  const vendor = findVendor(invoice.vendorId);
  const policy = findPolicy(invoice.policyId);
  const assignee = findEmployee(invoice.assignedAnalystEmployeeId);
  if (!vendor || !policy || !assignee) {
    throw new Error(`Invoice ${invoice.invoiceId} is missing seed relations`);
  }
  return { ok: true, detail: { invoice, vendor, policy, assignee } };
}

export function sameTenantInvoiceNumberCount(invoice: Invoice): number {
  return invoiceRecords().filter(
    (item) => item.tenantId === invoice.tenantId && item.invoiceNumber === invoice.invoiceNumber,
  ).length;
}

export function vendorLegalName(vendorId: string): string | undefined {
  return findVendor(vendorId)?.legalName;
}

export function publicInvoice(invoice: Invoice) {
  const vendor = findVendor(invoice.vendorId);
  if (!vendor) {
    throw new Error(`Invoice ${invoice.invoiceId} is missing a vendor`);
  }
  return {
    invoiceId: invoice.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    amountCents: invoice.amountCents,
    currency: invoice.currency,
    status: invoice.status,
    vendorLegalName: vendor.legalName,
    issuedOn: invoice.issuedOn,
    dueOn: invoice.dueOn,
  };
}
