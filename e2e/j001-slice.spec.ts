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
  await expect(page.getByText("Submission and approval are not part of this slice.")).toBeVisible();
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

test("the invoice list is usable on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: /Avery Chen/ }).click();
  await expect(page.getByRole("link", { name: "INV-HBR-2026-0042" })).toBeVisible();
  await expect(page.getByText(DEMO_AUTH_LABEL)).toBeVisible();
});
