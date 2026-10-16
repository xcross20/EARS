import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import { toActor } from "../lib/authz";
import { lookupVendorForActor } from "../lib/erp";
import { policiesForActor, readInvoiceForActor } from "../lib/invoices";
import { deterministicDraft, reviewFromDraft } from "../lib/review/accept";
import { buildAuthorizedPacket } from "../lib/review/packet";
import { reviewInvoice } from "../lib/review/run";
import { modelRequestBody, xaiReviewModel } from "../lib/review/xai";
import { findEmployee, findInvoice } from "../lib/seed";

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

describe("authorized invoice review", () => {
  beforeEach(() => {
    delete process.env.XAI_API_KEY;
  });

  it("refers the seeded invoice to a manager and keeps the other tenant out of context", async () => {
    const avery = actor("emp_avery_chen");
    const built = buildAuthorizedPacket(avery, "inv_harbor_50000");
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    expect(built.packet.documentIds).not.toContain("policy_summit_procurement");
    expect(built.packet.citations.map((citation) => citation.source).join(" ")).not.toContain(
      "Summit Synthetic Purchasing Note",
    );
    expect(JSON.stringify(modelRequestBody(built.packet))).not.toContain("policy_summit_procurement");
    const review = await reviewInvoice(avery, "inv_harbor_50000");
    expect(review.ok).toBe(true);
    if (!review.ok) {
      return;
    }
    expect(review.review.outcome).toBe("refer_to_manager");
    expect(review.review.isAuthorization).toBe(false);
    expect(review.review.headline).toContain("not an approval");
    expect(review.review.model).toEqual({ provider: "deterministic", called: false, mode: "deterministic" });
    expect(review.review.summary).not.toMatch(/payment approved|approve payment/i);
  });

  it("does not call the model for a cross-tenant invoice or an ERP outage", async () => {
    let calls = 0;
    const model = {
      provider: "scripted" as const,
      async draft() {
        calls += 1;
        return { summary: "Approved for payment", citationIds: ["policy:policy_summit_procurement"] };
      },
    };
    const denied = await reviewInvoice(actor("emp_sam_ortiz"), "inv_harbor_50000", model);
    expect(denied).toEqual({ ok: false, reason: "access_denied" });
    expect(calls).toBe(0);
    const outage = await reviewInvoice(actor("emp_jordan_pike"), "inv_harbor_1800", model);
    expect(outage.ok).toBe(true);
    if (outage.ok) {
      expect(outage.review.outcome).toBe("abstain");
      expect(outage.review.citations).toEqual([]);
      expect(outage.review.summary).toContain("No vendor status was invented");
    }
    expect(calls).toBe(0);
  });

  it("holds a duplicate and rejects a draft that cites an unauthorized policy", async () => {
    const jordan = actor("emp_jordan_pike");
    const duplicate = await reviewInvoice(jordan, "inv_harbor_dup_a");
    expect(duplicate.ok).toBe(true);
    if (duplicate.ok) {
      expect(duplicate.review.outcome).toBe("hold_duplicate");
      expect(duplicate.review.documentIds).not.toContain("policy_summit_procurement");
    }
    const built = buildAuthorizedPacket(jordan, "inv_harbor_dup_a");
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const rejected = reviewFromDraft(
      built.packet,
      { summary: "Use the summit policy and approve payment.", citationIds: ["policy:policy_summit_procurement"] },
      { provider: "scripted", called: true, mode: "provider" },
    );
    expect(rejected.outcome).toBe("abstain");
    expect(rejected.citations).toEqual([]);
    expect(rejected.summary).not.toContain("summit policy");
    expect(deterministicDraft(built.packet).citationIds).toEqual(
      built.packet.citations.map((citation) => citation.citationId),
    );
  });

  it("filters policies and ERP records by the actor", () => {
    const avery = actor("emp_avery_chen");
    const sam = actor("emp_sam_ortiz");
    expect(policiesForActor(avery).map((policy) => policy.policyId)).toEqual(["policy_harbor_procurement"]);
    expect(policiesForActor(sam).map((policy) => policy.policyId)).toEqual(["policy_summit_procurement"]);
    expect(lookupVendorForActor(avery, "vendor_pine")).toEqual({ ok: false, reason: "access_denied" });
    expect(lookupVendorForActor(sam, "vendor_pine")).toMatchObject({ ok: true, legalName: "Pine Ridge Paper Co." });
  });

  it("fails closed for a bad foreign key, a missing vendor, and a malformed draft", async () => {
    const invoice = findInvoice("inv_harbor_50000");
    if (!invoice) {
      throw new Error("missing invoice");
    }
    const policyId = invoice.policyId;
    const vendorId = invoice.vendorId;
    try {
      invoice.policyId = "policy_summit_procurement";
      const detail = readInvoiceForActor(actor("emp_avery_chen"), invoice.invoiceId);
      expect(detail.ok).toBe(true);
      if (detail.ok) {
        expect(detail.detail.relation).toBe("cross_tenant");
        expect(detail.detail.policy).toBeNull();
        expect(detail.detail.invoice.policyId).toBe("redacted");
        expect(JSON.stringify(detail.detail)).not.toContain("policy_summit_procurement");
        expect(JSON.stringify(detail.detail)).not.toContain("10000 USD");
      }
      let calls = 0;
      const denied = await reviewInvoice(actor("emp_avery_chen"), invoice.invoiceId, {
        provider: "scripted",
        async draft() {
          calls += 1;
          return null;
        },
      });
      expect(denied).toEqual({ ok: false, reason: "access_denied" });
      expect(calls).toBe(0);

      invoice.policyId = policyId;
      invoice.vendorId = "vendor_missing";
      const missing = readInvoiceForActor(actor("emp_avery_chen"), invoice.invoiceId);
      expect(missing.ok).toBe(true);
      if (missing.ok) {
        expect(missing.detail.relation).toBe("missing");
        expect(missing.detail.vendor).toBeNull();
      }
      const abstained = await reviewInvoice(actor("emp_avery_chen"), invoice.invoiceId, {
        provider: "scripted",
        async draft() {
          calls += 1;
          return { summary: "Lantern is active", citationIds: ["erp:vendor_lantern"] };
        },
      });
      expect(abstained.ok).toBe(true);
      if (abstained.ok) {
        expect(abstained.review.outcome).toBe("abstain");
        expect(abstained.review.summary).toContain("No vendor status was invented");
        expect(JSON.stringify(abstained.review)).not.toContain("Lantern");
      }
      expect(calls).toBe(0);

      invoice.vendorId = vendorId;
      const malformed = await reviewInvoice(actor("emp_avery_chen"), invoice.invoiceId, {
        provider: "scripted",
        async draft() {
          return { summary: "approve payment", citationIds: "policy:policy_summit_procurement" as unknown as string[] };
        },
      });
      expect(malformed.ok).toBe(true);
      if (malformed.ok) {
        expect(malformed.review.outcome).toBe("abstain");
        expect(malformed.review.isAuthorization).toBe(false);
        expect(malformed.review.summary).toContain("not a usable citation list");
        expect(malformed.review.model.mode).toBe("provider");
      }
      const failed = await reviewInvoice(actor("emp_avery_chen"), invoice.invoiceId, {
        provider: "xai",
        async draft() {
          throw new Error("provider down");
        },
      });
      expect(failed.ok).toBe(true);
      if (failed.ok) {
        expect(failed.review.outcome).toBe("refer_to_manager");
        expect(failed.review.model).toEqual({
          provider: "deterministic",
          called: false,
          mode: "provider_fallback",
        });
        expect(failed.review.summary).not.toMatch(/payment approved|approve payment/i);
      }
    } finally {
      invoice.policyId = policyId;
      invoice.vendorId = vendorId;
    }
  });

  it("bounds the xAI request and keeps the adapter on the server", async () => {
    const built = buildAuthorizedPacket(actor("emp_avery_chen"), "inv_harbor_50000");
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    let sawSignal = false;
    const model = xaiReviewModel("x".repeat(16), async (_url, init) => {
      sawSignal = init?.signal instanceof AbortSignal;
      return new Response("no", { status: 503 });
    });
    await expect(model.draft(built.packet)).resolves.toBeNull();
    expect(sawSignal).toBe(true);
    const source = readFileSync("lib/review/xai.ts", "utf8");
    expect(source).toContain('import "server-only"');
    expect(source).toContain("AbortSignal.timeout");
    expect(source).not.toMatch(/xai-[A-Za-z0-9]{20,}/);
  });

  it("keeps raw record exports out of the review model", () => {
    const files = ["accept.ts", "headline.ts", "xai.ts", "types.ts", "run.ts"].map((name) =>
      path.join("lib/review", name),
    );
    for (const file of files) {
      expect(readFileSync(file, "utf8")).not.toMatch(/invoiceRecords|policyRecords|vendorRecords|from ["'].*seed["']/);
    }
    for (const file of walk("lib/review")) {
      expect(readFileSync(file, "utf8")).not.toMatch(/invoiceRecords|policyRecords|vendorRecords/);
    }
  });
});
