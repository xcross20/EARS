# EARS-002 builder report

**Role:** Builder. This report does not accept the work order.
**Branch:** `feat/ears-002`
**Base:** `origin/control/ears-001-accept` at `695aba6`
**Implementation commit:** `52564da8983ab1711e93ef385ede897d205163e7`
`NEXT.md`, `STATE.md`, and `DECISION.md` were not changed. EARS-003 was not started.

## What changed
- `invoicesForView` returns `access_denied` unless `authorizeListView` allows the view. The list route still checks the view as well.
- Invoice, policy, and vendor arrays are no longer exported. `lib/review` does not import `invoiceRecords`, `policyRecords`, or `vendorRecords`.
- Policy retrieval and the mock ERP lookup are actor-scoped. A Harbor session cannot read the Summit policy or the Summit vendor.
- `POST /api/invoices/:id/review` builds a packet only after `readInvoiceForActor`. Cross-tenant calls return 403 and do not call the model.
- Deterministic checks cover the policy USD threshold, a duplicate invoice number, and the mock ERP. ERP outage abstains and does not invent a vendor status. A draft that cites an id outside the packet is discarded.
- The analyst detail page has **Run AI review**. Without `XAI_API_KEY`, the server uses the deterministic draft and says no external model was called. An optional xAI chat-completions adapter is server-side only. Its output still has to cite the authorized packet. The review object sets `isAuthorization` to false.
- The seeded $50,000 invoice description contains an instruction to pull in the Summit policy and approve payment. The review still refers the invoice to a manager and does not cite that policy.

## Commands and exit codes
Working directory: `/Users/immanuellewis/worktrees/EARS`. Node `v22.22.0`. npm `10.9.4`. Date: 2026-10-16. These runs are after the final assertion tweak in the browser test.

| Command | Exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | `tsc --noEmit` |
| `npm test` | 0 | Vitest 3.2.7. 3 files, 16 tests passed. |
| `npm run test:e2e` | 0 | Playwright. 5 tests passed in 16.2s. The web server builds, then starts. Warning: `NO_COLOR` ignored because `FORCE_COLOR` is set. |
| `npm run build` | 0 | Next.js 15.5.28 compiled successfully. This explicit build was immediately before the final e2e locator tweak. The passing e2e run built again. |
| `npm audit --audit-level=critical` | 1 | 5 vulnerabilities: 2 moderate, 1 high, 2 critical. Dependencies were not changed. `npm audit fix --force` was not run. This is not a passing audit. |

## Negative checks
- Analyst `invoicesForView` for oversight and evidence is `{ ok: false, reason: "access_denied" }`.
- Avery's policy list is only `policy_harbor_procurement`. Sam's is only `policy_summit_procurement`.
- Avery's ERP lookup of `vendor_pine` is `access_denied` and includes no vendor name.
- Sam's review of `inv_harbor_50000` is `access_denied` and the scripted model is not called. The browser API test, with forged manager and Harbor headers, is 403 and the body does not contain the Harbor policy title, `5000000`, or Cedar.
- Jordan's Lantern invoice abstains on `erp_unavailable`. The model is not called. The summary says no vendor status was invented.
- A scripted draft that cites `policy:policy_summit_procurement` becomes `abstain` with no citations.
- The model request body for Avery's packet does not contain `policy_summit_procurement`.
- Approve and pay routes are unchanged and still return 403 in the browser suite.

## Limitations
- Logout still does not revoke a copied cookie. That remains the EARS-003 constraint from R01-03.
- The deterministic draft is the default. A live xAI call happens only when `XAI_API_KEY` is at least 16 characters. CI and the browser suite set that variable empty.
- Review results are not stored. Submission, manager approval, and the audit viewer are EARS-003.
- PostCSS and Tinypool advisories are unchanged from the accepted EARS-001 disposition.

## Not done
No self-review, no ACCEPT, no merge, no deploy, no EARS-003.
