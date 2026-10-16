import type { InvoiceStatus } from "./types";

export function formatUsd(amountCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}

export function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid ISO date: ${isoDate}`);
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function statusLabel(status: InvoiceStatus): string {
  if (status === "awaiting_analyst_review") {
    return "Awaiting analyst review";
  }
  if (status === "pending_manager_decision") {
    return "Pending manager decision";
  }
  if (status === "manager_approved") {
    return "Manager approved. No payment sent.";
  }
  return "Manager rejected. No payment sent.";
}
