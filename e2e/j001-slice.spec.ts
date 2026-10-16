import { expect, test, type Page } from "@playwright/test";

import { DEMO_AUTH_LABEL, SIMULATION_LABEL } from "../lib/copy";

async function login(page: Page, employeeId: string) {
  const response = await page.request.post("/api/session", {
    data: { employeeId, role: "manager", tenantId: "tenant_summit" },
  });
  expect(response.status()).toBe(200);
  return (await response.json()) as { actor: { role: string; tenantId: string; displayName: string } };
}

test("analyst opens the seeded invoice from the browser", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(DEMO_AUTH_LABEL)).toBeVisible();
  await expect(page.getByText(SIMULATION_LABEL)).toBeVisible();
  await page.getByRole("button", { name: /Avery Chen/ }).click();
  await expect(page.getByRole("heading", { name: "Assigned invoices" })).toBeVisible();
  await expect(page.getByRole("link", { name: "INV-HBR-2026-0042" })).toBeVisible();
  await expect(page.getByText("$50,000.00")).toBeVisible();
  await page.getByRole("link", { name: "INV-HBR-2026-0042" }).click();
  await expect(page.getByRole("heading", { name: "$50,000.00" })).toBeVisible();
  await expect(page.getByText("Cedar Office Supply LLC")).toBeVisible();
  await expect(page.getByText("Synthetic Procurement Policy")).toBeVisible();
  await expect(page.getByText("It is not an approval and it cannot submit a payment.")).toBeVisible();
  await page.getByRole("button", { name: "Run AI review" }).click();
  await expect(page.getByRole("heading", { name: "Refer to a manager. This is not an approval." })).toBeVisible();
  const review = page.locator(".review-panel");
  await expect(review.getByText("Synthetic Procurement Policy 2026.1")).toBeVisible();
  await expect(review.getByText("Mock ERP vendor record")).toBeVisible();
  await expect(review.getByText("Cedar Office Supply LLC is active.", { exact: true })).toHaveCount(2);
  await expect(page.getByText("Deterministic evidence review. No external model was called.")).toBeVisible();
  await expect(page.locator(".review-panel").getByText("Summit Synthetic Purchasing Note")).toHaveCount(0);
});

test("manager and auditor see distinct views", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Morgan Hale/ }).click();
  await expect(page.getByRole("heading", { name: "Tenant oversight" })).toBeVisible();
  await expect(page.getByRole("link", { name: "INV-HBR-2026-0042" })).toBeVisible();
  await expect(page.getByRole("link", { name: "INV-HBR-2026-0188" })).toBeVisible();
  await page.goto("/invoices");
  await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();

  await page.getByRole("button", { name: "End demo session" }).click();
  await page.getByRole("button", { name: /Quinn Adler/ }).click();
  await expect(page.getByRole("heading", { name: "Audit evidence" })).toBeVisible();
  await page.getByRole("link", { name: "INV-HBR-2026-0042" }).click();
  await expect(page.getByText("Read-only evidence.")).toBeVisible();
  await expect(page.getByRole("button", { name: /approve/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /pay/i })).toHaveCount(0);
});

test("empty, denied, loading, and error states render", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Riley Quinn/ }).click();
  await expect(page.getByRole("heading", { name: "No invoices" })).toBeVisible();

  await login(page, "emp_sam_ortiz");
  await page.goto("/invoices/inv_harbor_50000");
  await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
  await expect(page.getByText("$50,000.00")).toHaveCount(0);

  await page.goto("/invoices");
  const delayed = page.goto("/invoices?demoState=slow");
  await expect(page.getByRole("status")).toHaveText("Loading invoices");
  await delayed;
  await expect(page.getByRole("heading", { name: "Assigned invoices" })).toBeVisible();

  await page.goto("/invoices?demoState=error");
  await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
  await expect(page.getByText("No payment was attempted.")).toBeVisible();
});

test("server denies spoofed headers, cross-tenant reads, approval, and payment", async ({ page }) => {
  const anonymous = await page.request.get("/api/invoices/inv_harbor_50000", {
    headers: { "x-role": "manager", "x-tenant-id": "tenant_harbor" },
  });
  expect(anonymous.status()).toBe(401);

  const spoofedLogin = await login(page, "emp_avery_chen");
  expect(spoofedLogin.actor).toMatchObject({ role: "analyst", tenantId: "tenant_harbor" });

  const sameTenantOtherInvoice = await page.request.get("/api/invoices/inv_harbor_1800", {
    headers: { "x-role": "manager", "x-tenant-id": "tenant_harbor" },
  });
  expect(sameTenantOtherInvoice.status()).toBe(403);

  const session = await page.request.get("/api/session", {
    headers: { "x-role": "auditor", "x-tenant-id": "tenant_summit" },
  });
  expect(session.status()).toBe(200);
  await expect(session.json()).resolves.toMatchObject({
    actor: { role: "analyst", tenantId: "tenant_harbor" },
  });

  await login(page, "emp_sam_ortiz");
  const crossTenant = await page.request.get("/api/invoices/inv_harbor_50000", {
    headers: { "x-role": "manager", "x-tenant-id": "tenant_harbor" },
  });
  expect(crossTenant.status()).toBe(403);
  const ownList = await page.request.get("/api/invoices?view=assigned");
  expect(ownList.status()).toBe(200);
  const listed = (await ownList.json()) as { invoices: { invoiceNumber: string }[] };
  expect(listed.invoices.map((invoice) => invoice.invoiceNumber)).toEqual(["INV-SMT-2026-0007"]);

  const approve = await page.request.post("/api/invoices/inv_harbor_50000/approve");
  expect(approve.status()).toBe(403);
  expect(await approve.json()).toEqual({ error: "operation_forbidden", operation: "approve" });

  const pay = await page.request.post("/api/payments");
  expect(pay.status()).toBe(403);
  expect(await pay.json()).toEqual({ error: "operation_forbidden", operation: "pay" });

  const crossDecision = await page.request.post("/api/invoices/inv_harbor_50000/decision", {
    data: { expectedVersion: 0, outcome: "approve", rationale: "Cross-tenant approval." },
    headers: { "x-role": "manager", "x-tenant-id": "tenant_harbor" },
  });
  expect(crossDecision.status()).toBe(403);
  expect(await crossDecision.text()).not.toContain("Cedar");

  const leakedReview = await page.request.post("/api/invoices/inv_harbor_50000/review", {
    headers: { "x-role": "manager", "x-tenant-id": "tenant_harbor" },
  });
  expect(leakedReview.status()).toBe(403);
  const leakedBody = await leakedReview.text();
  expect(leakedBody).not.toContain("Synthetic Procurement Policy");
  expect(leakedBody).not.toContain("5000000");
  expect(leakedBody).not.toContain("Cedar");

  await page.context().addCookies([
    {
      name: "ears_demo_session",
      value: "tampered.token",
      url: "http://127.0.0.1:3000",
    },
  ]);
  const tampered = await page.request.get("/api/session");
  expect(tampered.status()).toBe(401);
});

test("analyst submits, manager decides, and the auditor reads the trace", async ({ page, playwright }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Avery Chen/ }).click();
  await expect(page.getByRole("heading", { name: "Assigned invoices" })).toBeVisible();
  const session = (await page.context().cookies("http://127.0.0.1:3000")).find(
    (cookie) => cookie.name === "ears_demo_session",
  );
  expect(session?.value).toBeTruthy();
  await page.getByRole("button", { name: "End demo session" }).click();
  await expect(page.getByText(DEMO_AUTH_LABEL)).toBeVisible();
  const replay = await playwright.request.newContext({
    baseURL: "http://127.0.0.1:3000",
    extraHTTPHeaders: { cookie: `ears_demo_session=${session?.value}` },
  });
  const replaySubmit = await replay.post("/api/invoices/inv_harbor_50000/submit", {
    data: { expectedVersion: 0 },
  });
  expect(replaySubmit.status()).toBe(401);
  expect(await replaySubmit.text()).not.toContain("Cedar");
  await replay.dispose();

  await page.getByRole("button", { name: /Avery Chen/ }).click();
  await page.getByRole("link", { name: "INV-HBR-2026-0042" }).click();
  await page.getByRole("button", { name: "Run AI review" }).click();
  await expect(page.getByRole("heading", { name: "Refer to a manager. This is not an approval." })).toBeVisible();
  await page.getByRole("button", { name: "Submit to manager" }).click();
  await expect(page.getByRole("heading", { name: "Submitted for a manager decision" })).toBeVisible();
  await expect(page.getByText("No payment was sent.")).toBeVisible();

  const again = await page.request.post("/api/invoices/inv_harbor_50000/submit", {
    data: { expectedVersion: 0 },
  });
  expect(again.status()).toBe(200);
  expect(await again.json()).toMatchObject({ idempotentReplay: true });
  const analystDecision = await page.request.post("/api/invoices/inv_harbor_50000/decision", {
    data: { expectedVersion: 1, outcome: "approve", rationale: "Analysts cannot approve." },
  });
  expect(analystDecision.status()).toBe(403);

  await page.getByRole("button", { name: "End demo session" }).click();
  await page.getByRole("button", { name: /Morgan Hale/ }).click();
  await page.getByRole("link", { name: "INV-HBR-2026-0042" }).click();
  await expect(page.getByRole("heading", { name: "Manager decision" })).toBeVisible();
  await expect(page.getByText("Synthetic Procurement Policy 2026.1")).toBeVisible();
  await page.getByLabel("Rationale").fill("Threshold exception reviewed. No payment.");
  await page.getByRole("button", { name: "Record manager approval" }).click();
  await expect(page.getByText("No payment was sent.")).toBeVisible();
  const pay = await page.request.post("/api/payments", { data: { amountCents: 5_000_000 } });
  expect(pay.status()).toBe(403);
  const replayDecision = await page.request.post("/api/invoices/inv_harbor_50000/decision", {
    data: { expectedVersion: 1, outcome: "approve", rationale: "A second approval must not commit." },
  });
  expect(replayDecision.status()).toBe(200);
  expect(await replayDecision.json()).toMatchObject({ idempotentReplay: true, decision: { paymentExecuted: false } });

  await page.getByRole("button", { name: "End demo session" }).click();
  await page.getByRole("button", { name: /Quinn Adler/ }).click();
  await expect(page.getByRole("heading", { name: "Chronological audit" })).toBeVisible();
  await expect(page.getByText("Threshold exception reviewed. No payment.")).toBeVisible();
  await expect(page.getByText("Synthetic Procurement Policy 2026.1").first()).toBeVisible();
  await expect(page.getByText("Summit Synthetic Purchasing Note")).toHaveCount(0);
  const tamper = await page.request.post("/api/audit", { data: { rationale: "tampered" } });
  expect(tamper.status()).toBe(405);
  expect(await tamper.text()).not.toContain("tampered");
});

test("the invoice list is usable on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: /Avery Chen/ }).click();
  await expect(page.getByRole("link", { name: "INV-HBR-2026-0042" })).toBeVisible();
  await expect(page.getByText(DEMO_AUTH_LABEL)).toBeVisible();
});
