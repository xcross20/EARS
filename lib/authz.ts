import type { Actor, Employee, ForbiddenOperation, Invoice, ListView, Role } from "./types";
import { findTenant } from "./seed";

export function toActor(employee: Employee): Actor {
  const tenant = findTenant(employee.tenantId);
  if (!tenant) {
    throw new Error(`Employee ${employee.employeeId} has no tenant`);
  }
  return {
    employeeId: employee.employeeId,
    tenantId: employee.tenantId,
    tenantDisplayName: tenant.displayName,
    role: employee.role,
    displayName: employee.displayName,
    title: employee.title,
  };
}

export function canReadInvoice(actor: Actor, invoice: Invoice): boolean {
  if (actor.tenantId !== invoice.tenantId) {
    return false;
  }
  if (actor.role === "analyst") {
    return invoice.assignedAnalystEmployeeId === actor.employeeId;
  }
  return actor.role === "manager" || actor.role === "auditor";
}

export function authorizeListView(actor: Actor, view: ListView): boolean {
  if (view === "assigned") {
    return actor.role === "analyst";
  }
  if (view === "oversight") {
    return actor.role === "manager";
  }
  return actor.role === "auditor";
}

export function homePath(role: Role): string {
  if (role === "analyst") {
    return "/invoices";
  }
  if (role === "manager") {
    return "/oversight";
  }
  return "/evidence";
}

export function listViewTitle(view: ListView): string {
  if (view === "assigned") {
    return "Assigned invoices";
  }
  if (view === "oversight") {
    return "Tenant oversight";
  }
  return "Audit evidence";
}

export function navigationFor(role: Role): { href: string; label: string }[] {
  if (role === "analyst") {
    return [{ href: "/invoices", label: "Assigned invoices" }];
  }
  if (role === "manager") {
    return [{ href: "/oversight", label: "Tenant oversight" }];
  }
  return [{ href: "/evidence", label: "Audit evidence" }];
}

export function evaluateOperation(
  actor: Actor | null,
  operation: ForbiddenOperation,
): { status: 401 | 403; body: { error: string; operation?: ForbiddenOperation } } {
  if (!actor) {
    return { status: 401, body: { error: "unauthenticated" } };
  }
  return { status: 403, body: { error: "operation_forbidden", operation } };
}
