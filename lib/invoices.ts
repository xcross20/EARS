import { canReadInvoice } from "./authz";
import { findEmployee, findInvoice, findPolicy, findVendor, invoices } from "./seed";
import type { Actor, Employee, Invoice, ListView, PolicyMetadata, Vendor } from "./types";

export type InvoiceDetail = {
  invoice: Invoice;
  vendor: Vendor;
  policy: PolicyMetadata;
  assignee: Employee;
};

export function invoicesForView(actor: Actor, view: ListView): Invoice[] {
  return invoices.filter((invoice) => {
    if (invoice.tenantId !== actor.tenantId) {
      return false;
    }
    if (view === "assigned") {
      return invoice.assignedAnalystEmployeeId === actor.employeeId;
    }
    return true;
  });
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
