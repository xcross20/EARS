export const ROLES = ["analyst", "manager", "auditor"] as const;

export type Role = (typeof ROLES)[number];

export type ListView = "assigned" | "oversight" | "evidence";

export type InvoiceStatus =
  | "awaiting_analyst_review"
  | "pending_manager_decision"
  | "manager_approved"
  | "manager_rejected";

export type Tenant = {
  tenantId: string;
  displayName: string;
};

export type Employee = {
  employeeId: string;
  tenantId: string;
  role: Role;
  displayName: string;
  title: string;
};

export type Vendor = {
  vendorId: string;
  tenantId: string;
  legalName: string;
  status: "active";
  site: string;
  erpAvailability: "available" | "unavailable";
};

export type PolicyMetadata = {
  policyId: string;
  tenantId: string;
  title: string;
  version: string;
  thresholdNote: string;
};

export type Invoice = {
  invoiceId: string;
  tenantId: string;
  invoiceNumber: string;
  vendorId: string;
  amountCents: number;
  currency: "USD";
  status: InvoiceStatus;
  assignedAnalystEmployeeId: string;
  issuedOn: string;
  dueOn: string;
  description: string;
  policyId: string;
};

export type Actor = {
  employeeId: string;
  tenantId: string;
  tenantDisplayName: string;
  role: Role;
  displayName: string;
  title: string;
};

export type ForbiddenOperation = "approve" | "pay";
