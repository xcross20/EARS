import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  authorizeListView,
  canReadInvoice,
  evaluateOperation,
  toActor,
} from "../lib/authz";
import { shouldDelayDemoLoad, shouldShowDemoFault } from "../lib/faults";
import { formatUsd } from "../lib/format";
import { invoicesForView, readInvoiceForActor } from "../lib/invoices";
import { findEmployee, findInvoice, invoices, SEEDED_INVOICE_AMOUNT_CENTS } from "../lib/seed";

function actor(employeeId: string) {
  const employee = findEmployee(employeeId);
  if (!employee) {
    throw new Error(employeeId);
  }
  return toActor(employee);
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      return walk(full);
    }
    return full.endsWith(".ts") || full.endsWith(".tsx") ? [full] : [];
  });
}

describe("invoice authorization", () => {
  it("keeps the seeded invoice at 50000 USD", () => {
    const invoice = findInvoice("inv_harbor_50000");
    expect(invoice?.amountCents).toBe(SEEDED_INVOICE_AMOUNT_CENTS);
    expect(formatUsd(SEEDED_INVOICE_AMOUNT_CENTS)).toBe("$50,000.00");
    expect(new Set(invoices.map((item) => item.tenantId)).size).toBe(2);
  });

  it("shows Avery only the assigned invoice and hides the other tenant", () => {
    const avery = actor("emp_avery_chen");
    const visible = invoicesForView(avery, "assigned").map((invoice) => invoice.invoiceId);
    expect(visible).toEqual(["inv_harbor_50000"]);
    expect(readInvoiceForActor(avery, "inv_harbor_50000").ok).toBe(true);
    expect(readInvoiceForActor(avery, "inv_harbor_1800")).toEqual({ ok: false, reason: "access_denied" });
    expect(readInvoiceForActor(avery, "inv_summit_9600")).toEqual({ ok: false, reason: "access_denied" });
    expect(readInvoiceForActor(null, "inv_harbor_50000")).toEqual({ ok: false, reason: "unauthenticated" });
  });

  it("gives manager and auditor distinct views inside the tenant", () => {
    const manager = actor("emp_morgan_hale");
    const auditor = actor("emp_quinn_adler");
    expect(authorizeListView(manager, "oversight")).toBe(true);
    expect(authorizeListView(manager, "assigned")).toBe(false);
    expect(authorizeListView(manager, "evidence")).toBe(false);
    expect(authorizeListView(auditor, "evidence")).toBe(true);
    expect(authorizeListView(auditor, "oversight")).toBe(false);
    expect(invoicesForView(manager, "oversight").map((invoice) => invoice.invoiceId)).toEqual([
      "inv_harbor_50000",
      "inv_harbor_1800",
    ]);
    expect(canReadInvoice(auditor, findInvoice("inv_summit_9600")!)).toBe(false);
    expect(invoicesForView(actor("emp_riley_quinn"), "assigned")).toEqual([]);
  });

  it("forbids approval and payment for every role", () => {
    for (const employeeId of ["emp_avery_chen", "emp_morgan_hale", "emp_quinn_adler", "emp_sam_ortiz"]) {
      expect(evaluateOperation(actor(employeeId), "approve").status).toBe(403);
      expect(evaluateOperation(actor(employeeId), "pay")).toEqual({
        status: 403,
        body: { error: "operation_forbidden", operation: "pay" },
      });
    }
    expect(evaluateOperation(null, "pay").status).toBe(401);
  });

  it("shows demo faults only when the test switch is on", () => {
    expect(shouldShowDemoFault("error", undefined)).toBe(false);
    expect(shouldShowDemoFault("error", "1")).toBe(true);
    expect(shouldDelayDemoLoad("slow", "1")).toBe(true);
    expect(shouldDelayDemoLoad("slow", undefined)).toBe(false);
  });

  it("has no live payment integration in the application source", () => {
    const source = ["app", "lib", "components"]
      .flatMap((dir) => walk(dir))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    expect(source).not.toMatch(/stripe|plaid|\bswift\b|routing number|account number/i);
  });
});
