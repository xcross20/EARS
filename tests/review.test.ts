import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import { toActor } from "../lib/authz";
import { lookupVendorForActor } from "../lib/erp";
import { policiesForActor } from "../lib/invoices";
import { deterministicDraft, reviewFromDraft } from "../lib/review/accept";
import { buildAuthorizedPacket } from "../lib/review/packet";
import { reviewInvoice } from "../lib/review/run";
import { modelRequestBody } from "../lib/review/xai";
import { findEmployee } from "../lib/seed";

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
    expect(review.review.model).toEqual({ provider: "deterministic", called: false });
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
      { provider: "scripted", called: true },
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
