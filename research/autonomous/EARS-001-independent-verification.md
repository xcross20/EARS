# EARS-001-R02 independent verification

### 1. Reviewed commit and reviewer identity

- Work order: EARS-001. Verification id: EARS-001-R02.
- Repository: `xcross20/EARS`. Implementation pull request: https://github.com/xcross20/EARS/pull/2
- Reviewed SHA: `00eba687ce015d001dec0d3f3aa4d2b2874d6db2`
- `git rev-parse HEAD` in `/tmp/ears-r02-verify` printed that SHA before install, before tests, before the production build, and before the production server started.
- Implementation commit: `23a268e5749fcb68c9e7bb80c46a02ffd4e51ba9`. `git diff --stat 23a268e5749fcb68c9e7bb80c46a02ffd4e51ba9 HEAD` shows only `research/autonomous/EARS-001-builder-report.md` (75 lines). The application tree at the reviewed SHA is that implementation commit.
- Evidence commits on top of the implementation: `2df08f3715b34086e2b939b1676f72d8725faa8d` and `00eba687ce015d001dec0d3f3aa4d2b2874d6db2`.
- Reviewer: a separate Grok verifier session for EARS-001-R02. This session did not author `23a268e`, `2df08f3`, or `00eba68`, and it did not author the R01 review. This document does not accept the work order, does not merge, and does not deploy.

### 2. Independence statement

The checkout is a new detached worktree created with `git worktree add --detach /tmp/ears-r02-verify 00eba687ce015d001dec0d3f3aa4d2b2874d6db2`. Its `node_modules` came only from `npm ci` in that directory. The R01 review is not in this SHA (`git ls-files research` lists the builder report and `research/autonomous/README.md` only). It was read after the unit tests and the e2e run, from `origin/review/ears-001-r01:research/autonomous/EARS-001-review.md` (`41614fe2b2e634ab239e1d2044a7397e1df63d29`). It was treated as a claim list, not as a script.

Limit: one `npm ci` was accidentally started in `/Users/immanuellewis/worktrees/EARS` on branch `review/ears-001-r01` before the shell cwd was corrected. That command exited 0, refreshed ignored `node_modules` there, and did not change tracked files. None of the results below are from that tree. The hostile probe used a different port, a different signing secret, and a new script at `/tmp/ears-r02-probe.mjs`. The secret is not printed here. It is 28 characters, is not `.env.example`, is not `ci-demo-session-secret`, is not `e2e-demo-session-secret`, and is not the R01 secret.

### 3. Commands and results

Environment: macOS, Node `v22.22.0`, npm `10.9.4`. Working directory `/tmp/ears-r02-verify`. `EARS_ALLOW_DEMO_FAULTS` was unset for the production server. Playwright Chromium was installed in this run because a clean worktree does not include browsers.

| Command | Exit | Observed result |
| --- | --- | --- |
| `npm ci` | 0 | 80 packages. The install text reported 5 vulnerabilities. |
| `npm run typecheck` | 0 | `tsc --noEmit` |
| `npm test` | 0 | Vitest 3.2.7. 2 files, 11 tests passed. |
| `npx playwright install chromium` | 0 | Chromium installed before e2e. |
| `npm run test:e2e` | 0 | Playwright. 5 passed in 18.8s. `NO_COLOR` was ignored because `FORCE_COLOR` is set. |
| `npm run build` | 0 | Next.js 15.5.28 compiled successfully. Routes `/`, `/invoices`, `/invoices/[invoiceId]`, `/oversight`, and `/evidence` are dynamic. |
| `npm audit --audit-level=critical` | 1 | Not a pass. 5 vulnerabilities: 2 moderate, 1 high, 2 critical. `npm audit fix` was not run. |

`npm ls postcss tinypool --all` in this worktree:

- `next@15.5.28` → `postcss@8.4.31` (production)
- `vitest@3.2.7` → `tinypool@1.1.1` (dev)
- `vitest@3.2.7` → `vite@7.3.7` → `postcss@8.5.30` (dev)

`npm ls --omit=dev postcss tinypool` keeps only `next@15.5.28` → `postcss@8.4.31`. Tinypool is not in the production tree. A search of `.next/server` and `.next/static` found no `tinypool` string. The signing secret is not in `.next/static` or `.next/server`. The server bundle reads `process.env.EARS_DEMO_SESSION_SECRET` at runtime. The string `e2e-demo-session-secret-placeholder` is in the server bundle only as a rejected-secret literal (`lib/session.ts` lines 8–13).

GitHub Actions for SHA `00eba687ce015d001dec0d3f3aa4d2b2874d6db2`, read with `gh`, are not a substitute for the local run:

- EARS-001 checks, run 38920791199, job `app`, conclusion success, head SHA matches. The log shows 2 unit test files passed, 5 Playwright tests passed (26.4s), and `Compiled successfully`.
- EARS-001 checks, run 38920784990, job `app`, conclusion success, same head SHA.
- Foundation checks on runs 38920791533 and 38920784354 concluded success.
- `gh pr checks 2` reported both `app` jobs and both `foundation` jobs as pass.
- CI does not run `npm audit`. The `npm ci` log line mentions `npm audit fix --force` only as npm's install notice. The workflow still succeeded.

### 4. Security verification

Production server: `npm run start -- --hostname 127.0.0.1 --port 3219` after the build above, with a non-example `EARS_DEMO_SESSION_SECRET` of 28 characters and `EARS_ALLOW_DEMO_FAULTS` unset. Next.js 15.5.28 reported ready. The first probe script exited 1. Five of its assertions treated the requested path segment `inv_harbor_*` inside the router state, and an unauthenticated HTTP 200, as leaks. A second read of those bodies found no amount, vendor, or invoice number. The checks below are the second reading plus the assertions that passed the first time.

Demo identity selection is not production authentication. `POST /api/session` with a seeded `employeeId` issues that employee's session. The homepage renders every seeded employee and the banner `DEMO — NOT PRODUCTION AUTH. Simulation only. Synthetic data. No payments.` It does not render `INV-HBR`, `INV-SMT`, `$50,000.00`, Cedar, Lantern, or Pine Ridge. No SSO gate exists. This matches the work order and is not a hidden production-auth claim.

1. Signed cookie integrity and expiration. Login `Set-Cookie` was `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`. The value decoded to `{"v":1,"employeeId":"emp_avery_chen","exp":...}` with no role and no tenant. The secret was not in the header or the JSON. A one-character signature change returned `401 {"error":"unauthenticated"}`. A token signed with a different secret returned 401. A manager token with `exp` one minute in the past returned 401. A token with `exp` one millisecond before the probe clock returned 401. HMAC-SHA256 and `timingSafeEqual` are in `lib/session.ts` lines 62–82, and expiry is lines 93–95.
2. Role and tenant come from the seed. Avery's login body also sent `role: "manager"` and `tenantId: "tenant_summit"`. The response was analyst and `tenant_harbor`. A cookie whose signed JSON added `role: "manager"` and `tenantId: "tenant_summit"` still resolved to Avery, analyst, Harbor. Morgan's login body said auditor and Summit; the actor was manager and Harbor. Quinn's login body said manager; the actor was auditor. `lib/authority.ts` lines 19–32 discards `headerRole` and `headerTenant` and loads the employee with `findEmployee`.
3. Cross-tenant read. Sam Ortiz (`tenant_summit`) `GET /api/invoices/inv_harbor_50000` with `X-Role: manager` and `X-Tenant-Id: tenant_harbor` returned `403 {"error":"access_denied"}`. The body did not contain `INV-HBR-2026-0042`, `$50,000.00`, `5000000`, or Cedar. Sam's assigned list was only `INV-SMT-2026-0007`. Morgan's `GET /api/invoices/inv_summit_9600` was 403 and did not contain Pine Ridge, `INV-SMT-2026-0007`, or `960000`. The HTML for Sam on `/invoices/inv_harbor_50000` said Access denied and did not contain the amount, vendor, or invoice number. Cache-Control was `private, no-cache, no-store, max-age=0, must-revalidate`.
4. Same-tenant analyst isolation. Avery `GET /api/invoices/inv_harbor_1800`, including spoofed manager and Jordan headers, returned `403 {"error":"access_denied"}` with no Lantern, `INV-HBR-2026-0188`, or `180000`. Jordan `GET /api/invoices/inv_harbor_50000` returned 403 with no Cedar, `INV-HBR-2026-0042`, or `5000000`. Jordan can read his own `inv_harbor_1800`. Avery's assigned list is only `inv_harbor_50000`. The denied HTML for Avery on Jordan's invoice said Access denied and did not contain the amount, vendor, or invoice number.
5. Role-specific views. Analyst `view=oversight` and `view=evidence` returned 403 with no invoice fields. Analyst HTML `/oversight` and `/evidence` said Access denied and did not contain invoice amounts, vendors, or numbers. Manager `view=assigned` and `view=evidence` returned 403 with empty invoice content. Manager HTML `/invoices` and `/evidence` said Access denied without those fields. Manager `view=oversight` returned both Harbor invoices and not `INV-SMT`. Auditor `view=assigned` and `view=oversight` returned 403 without invoice fields. Auditor `view=evidence` returned both Harbor invoices and not `INV-SMT`. Auditor HTML on the Harbor detail said `Read-only evidence` and the body had no approve or pay control. The route guard is `app/api/invoices/route.ts` lines 24–26, before `invoicesForView`. The page guard is `components/InvoiceListView.tsx` lines 38–39, before `InvoiceListBody`.
6. Missing cookie. `GET /api/invoices/inv_harbor_50000` with `X-Role`, `X-Tenant-Id`, and `X-Employee-Id` and no cookie returned `401 {"error":"unauthenticated"}` and none of the invoice markers. `GET /api/session` with Avery's cookie plus auditor and Summit headers stayed analyst and Harbor. Non-string, missing, and unknown employee ids returned `400 {"error":"unknown_identity"}` and set no cookie.
7. Approve and pay do not change state. For Avery, Morgan, Quinn, and Sam, `POST /api/invoices/inv_harbor_50000/approve` with `{"status":"paid"}` returned `403 {"error":"operation_forbidden","operation":"approve"}`. `POST /api/payments` with a paid status and `amountCents: 5000000` returned `403 {"error":"operation_forbidden","operation":"pay"}`. Neither body contained invoice content. Unauthenticated posts with `X-Role: manager` returned 401. `GET /api/payments` returned 405. Avery's invoice status was `awaiting_analyst_review` before and after. Jordan's invoice stayed `awaiting_analyst_review`. `evaluateOperation` (`lib/authz.ts` lines 69–77) has no success path. The approve and payment handlers only return that result (`app/api/invoices/[invoiceId]/approve/route.ts` lines 7–9, `app/api/payments/route.ts` lines 7–9). A search of `app/`, `lib/`, and `components/` found no Stripe, Plaid, SWIFT, routing number, or account number. The seed status is a constant (`lib/seed.ts` lines 94–137). There is no payment integration.
8. Denied HTML and API bodies. API denials were exactly `{"error":"access_denied"}`. An unknown invoice id used the same body as a real forbidden id. Denied HTML and the RSC payload for Sam's cross-tenant read contained `Access denied` and the route segment the client already requested. They did not contain `$50,000.00`, `5000000`, Cedar, `INV-HBR-2026-0042`, or the invoice description. The RSC `description` hit was the document meta description, `Synthetic invoice review demo. Not production authentication.`
9. Unauthenticated document behavior. `GET /invoices/inv_harbor_50000` without a cookie was HTTP 200, not an HTTP 307. The body contains `<template data-dgst="NEXT_REDIRECT;replace;/;307;">` and the visible text `Loading invoices`. It does not contain the amount, vendor, or invoice number. The id appears only as the requested router segment. This is Next's document redirect shell. It is not a disclosure of the forbidden record. With faults unset, `/invoices?demoState=error` as Avery rendered Assigned invoices, not the demo error panel.
10. Logout replay. `DELETE /api/session` returned `200 {"ok":true}`. Sending the same cookie again returned 200 for Avery. The server does not keep a revocation list (`lib/session.ts` lines 47–59, `app/api/session/route.ts` lines 44–47, `lib/demo-session-actions.ts` lines 28–31).

`invoicesForView` (`lib/invoices.ts` lines 12–21) filters by tenant and, for `assigned`, by assignee. For `oversight` and `evidence` it returns every invoice in the actor's tenant and does not call `authorizeListView`. The two production callers do call that check first. A direct call with an analyst and `oversight` would return the other Harbor invoice. That is a deferred footgun, not a current bypass: the live analyst request returned 403.

`lib/seed.ts` lines 3–137 export `tenants`, `employees`, `vendors`, `policies`, and `invoices`. `app/page.tsx` uses the employee list for the demo picker. `components/InvoiceTable.tsx` calls `findVendor` on rows already filtered by the list view. No `"use client"` module imports the seed. `.next/static` does not contain `INV-SMT-2026-0007`, `inv_summit_9600`, Pine Ridge, `INV-HBR-2026-0188`, or Cedar. The server bundle does contain the seed, which is required to answer authorized requests. Exporting the raw arrays is acceptable for this read-only slice and is not acceptable as the data API for an EARS-002 model or ERP call.

The browser journey was the e2e run in this worktree, not a copied log. It showed Avery opening `INV-HBR-2026-0042` at `$50,000.00` with Cedar Office Supply LLC, Morgan on Tenant oversight and denied on `/invoices`, Quinn on read-only evidence with no approve or pay button, Riley's empty state, and Sam's denied Harbor page without `$50,000.00`.

### 5. Dependency advisory assessment

`npm audit --audit-level=critical` exited 1. Audit JSON and `npm view` on 2026-10-16: Next `15.5.28` is the newest 15.5 release and depends on `postcss@8.4.31`. The newest Next is `16.4.2`. The newest Vitest is `5.0.5`. The newest Tinypool is `2.2.0`. `npm audit fix --force` would move to those major versions. No same-major lockfile bump clears the audit. An `overrides` experiment was not run and is not claimed to be safe.

| Package | Version | Advisory | Severity | Path | Runtime | HTTP client of this demo | Non-major fix | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| postcss | 8.4.31 | GHSA-qx2v-qp2m-jg93 | moderate | `next` → `postcss` | Production install. CSS stringify XSS. | No. No route passes request content to PostCSS. App CSS is `app/globals.css`, compiled at build. | No. Audit fix is Next 16.4.2, semver major. | ACCEPT_WITH_DOCUMENTED_RISK |
| postcss | 8.4.31 | GHSA-6g55-p6wh-862q | high | `next` → `postcss` | Build-time `sourceMappingURL` file read. | No. Requires attacker-controlled CSS passed to `postcss().process`. | No same-major Next fix. Patched PostCSS is 8.5.12, which Next 15.5.28 does not use. | ACCEPT_WITH_DOCUMENTED_RISK |
| postcss | 8.4.31 | GHSA-fxqj-rqcc-2cmp | moderate | `next` → `postcss` | Incomplete fix of the map read when `from` is unset. Range `<=8.5.22`. | Same. Not reachable from invoice requests. | No same-major fix. | ACCEPT_WITH_DOCUMENTED_RISK |
| postcss | 8.4.31 | GHSA-r28c-9q8g-f849 | high | `next` → `postcss` | Build-time `.map` disclosure. Range `<=8.5.17`. | Same. | No same-major fix. | ACCEPT_WITH_DOCUMENTED_RISK |
| tinypool | 1.1.1 | GHSA-5gmw-xhrv-c9v3 | critical | `vitest` → `tinypool` | Dev worker-pool gadget. Prototype pollution of `execArgv` or `env` becomes a Worker option. | No. Not imported by `app/`, `lib/`, or `components/`. Absent from `.next/server`. Not in `npm ls --omit=dev`. Needs a pollution primitive and a Tinypool worker. | No. Patched line is Tinypool 2.1.1. Vitest 3.2.7 depends on `tinypool@^1.1.1`. Audit fix is Vitest 5.0.5, semver major. | ACCEPT_WITH_DOCUMENTED_RISK |
| tinypool | 1.1.1 | GHSA-85c8-ppgw-ccpr | critical | `vitest` → `tinypool` | `pool.run(task, options)` can inherit `filename` from `Object.prototype`. Range `<2.1.2`. `run()` with no options object is not the bug. | No. This server never calls Tinypool. | Vitest 5 major only. | ACCEPT_WITH_DOCUMENTED_RISK |
| vitest and @vitest/mocker | vitest 3.2.7 | GHSA-82fw-gwwq-j7x9 | moderate | vitest dev tree | Path traversal through a hostile Vitest mock redirect. | No HTTP path. | Audit's offered fix is Vitest 5.0.5, semver major. | ACCEPT_WITH_DOCUMENTED_RISK |

Vite's PostCSS 8.5.30 is outside `<=8.5.22`. The production copy that keeps the audit red is Next's 8.4.31. The two critical advisories are real and are not treated as a passing audit. They are not reachable by a browser or API client of this demo, and there is no non-major fix. They do not block EARS-001. They should be cleared in a later, tested major upgrade. Do not run `npm audit fix --force` inside this order.

### 6. R01 findings

R01 (`origin/review/ears-001-r01`) was read after the local tests. Its technical findings match this run. Its controller recommendation does not travel.

- R01-01, `invoicesForView` role gap. Confirmed. `lib/invoices.ts` lines 12–21. Live analyst `view=oversight` was 403. No current bypass. Not an acceptance block.
- R01-02, raw seed exports. Confirmed. `lib/seed.ts` lines 3–137. No current route returns another tenant's invoices through those exports. Not an acceptance block. It is a defect if EARS-002 passes those arrays to a model.
- R01-03, logout does not revoke the HMAC. Confirmed by `DELETE` then replay, status 200. Not an acceptance block while the product cannot approve or pay.
- R01-04, CI and Playwright secrets are in the repo and are not in `REJECTED_SECRETS`. Confirmed. `.github/workflows/ci.yml` line 9 and `playwright.config.ts` line 3. `.env.example` is rejected (`lib/session.ts` lines 8–28). No deployed process was using the CI value. Not an acceptance block.
- R01-05, e2e does not request analyst `view=oversight` or manager `view=assigned`. Confirmed by reading `e2e/j001-slice.spec.ts`. This run's probe did, and both returned 403. Coverage gap only. Not an acceptance block.
- R01 dependency dispositions. Confirmed, with versions and advisory ids re-read from this worktree's audit JSON and the GitHub advisory pages. Vite's PostCSS 8.5.30 is not the vulnerable production copy.
- R01 verdict `NO_MATERIAL_DEFECTS`. Confirmed on the evidence above.
- R01 controller recommendation `CONTINUE`. Not adopted. R01 refused `ACCEPT` because that session also wrote the implementation. This session did not. The behavior R01 described held under a new probe. That identity limit is not a product defect.

R01 said the unauthenticated browser route redirects to `/`. The raw document response in this run was HTTP 200 with an embedded `NEXT_REDIRECT` to `/` and no invoice content. The disagreement is about the status code, not about a data leak.

### 7. Additional findings

No additional P0 or P1. The unauthenticated 200 redirect shell is recorded in section 4 and is not a new defect. No application file was changed.

### 8. Final verdict

`NO_MATERIAL_DEFECTS`

### 9. Whether each finding blocks acceptance

| Id | Severity | Location | Blocks acceptance now |
| --- | --- | --- | --- |
| R02-01 (same as R01-01) | P2 | `lib/invoices.ts` lines 12–21 | No. Fix before an EARS-002 caller uses this helper without `authorizeListView`. |
| R02-02 (same as R01-02) | P2 | `lib/seed.ts` lines 3–137 | No. Stop exporting raw arrays before a model or ERP adapter reads them. |
| R02-03 (same as R01-03) | P3 | `lib/session.ts` lines 47–59; `app/api/session/route.ts` lines 44–47 | No. Revoke tokens before EARS-003 can approve. |
| R02-04 (same as R01-04) | P3 | `.github/workflows/ci.yml` line 9; `playwright.config.ts` line 3 | No. Do not reuse those public strings outside CI and e2e. |
| R02-05 (same as R01-05) | P3 | `e2e/j001-slice.spec.ts` | No. Add the two view requests when the suite is next edited. |
| PostCSS GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 | high or moderate, as in section 5 | `next@15.5.28` → `postcss@8.4.31` | No for this slice. `ACCEPT_WITH_DOCUMENTED_RISK`. |
| Tinypool GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr | critical | dev `vitest@3.2.7` → `tinypool@1.1.1` | No for this slice. `ACCEPT_WITH_DOCUMENTED_RISK`. Not reachable by a demo HTTP client. No non-major fix. |
| Vitest GHSA-82fw-gwwq-j7x9 | moderate | dev Vitest | No. `ACCEPT_WITH_DOCUMENTED_RISK`. |

P2 and P3 items above matter for EARS-002 or EARS-003. They are not breaks in this read-only journey.

### 10. Controller note

This verifier does not accept the work order and did not edit `NEXT.md`, `STATE.md`, or `DECISION.md`.

Recommendation: `ACCEPT`.

The recommendation is allowed because this session, which did not author the implementation, verified the browser journey, server-side tenant and role checks, the absence of a financial side effect, the local tests and build, the GitHub Actions results, and an explicit disposition for every advisory including the two critical Tinypool advisories. No unresolved P0 or P1 remains. `npm audit --audit-level=critical` exiting 1 is recorded and is not called a pass.

ACCEPT here means EARS-001 only. Do not start EARS-002 until R02-01 and R02-02 are closed or explicitly carried as the first constraints of that order. Do not treat logout as revocation before EARS-003 can write an approval. Do not merge this verification pull request as if it were the acceptance record. The human owner still merges and deploys.
