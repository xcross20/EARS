# EARS-001-R01 review

### A. Review metadata

- Work order: EARS-001. Review id: EARS-001-R01.
- Repository: `xcross20/EARS`. Pull request: https://github.com/xcross20/EARS/pull/2
- Branch reviewed: `feat/ears-001-app`
- Reviewed SHA: `00eba687ce015d001dec0d3f3aa4d2b2874d6db2`
- Implementation commit named by the builder: `23a268e5749fcb68c9e7bb80c46a02ffd4e51ba9`
- Evidence commits on top of that implementation: `2df08f3715b34086e2b939b1676f72d8725faa8d`, `00eba687ce015d001dec0d3f3aa4d2b2874d6db2`
- Those two evidence commits change only `research/autonomous/EARS-001-builder-report.md`. The application tree at the reviewed SHA is the implementation commit.
- Date: 2026-10-16
- Reviewer: Grok, assigned the Independent Reviewer role for EARS-001-R01.
- Independence: this session also authored the three commits above. The review did not modify application code, did not copy the builder's exit codes, and re-ran the checks and hostile cases below. It is not a separate human review. This document does not accept EARS-001.

### B. Executive assessment

The slice is a read-only synthetic invoice demo with server-derived role and tenant. The analyst, manager, and auditor journeys work. Cross-tenant reads, unassigned reads, forged headers, tampered cookies, expired cookies, approval, and payment were denied in a live production-mode process. No P0 or P1 defect was reproduced. The failed `npm audit` is real and is disposed below; it is not treated as a pass. The single Next.js service is a sound base for EARS-002 if new reads go through actor-scoped functions and do not import the raw seed into a model prompt.

### C. Architecture assessment

The single service is justified. This slice has no writes, no ERP call, and no model call. A second runtime would not move a trust boundary that the code actually uses.

Strengths:

- UI routes call `currentActor()` and then `authorizeListView` or `readInvoiceForActor`. API routes do the same. `lib/authority.ts` loads role and tenant from the employee id in the signed cookie.
- `evaluateOperation` has no success return. Approve and pay routes only emit that result.
- Page modules are small. Domain checks live in `lib/authz.ts` and `lib/invoices.ts`, not in JSX.
- Invoice HTML is dynamic and sent as `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`.
- Client static files under `.next/static` do not contain `INV-SMT-2026-0007`, `inv_summit_9600`, or `Pine Ridge`. The seed is present in a server chunk, which is expected and is not a browser bundle.

Concerns, not current bypasses:

- `invoicesForView` does not check the role. Callers must remember `authorizeListView`. Today's routes do.
- `lib/seed.ts` exports the full invoice, vendor, and policy arrays. Any future server module can read every tenant without an actor.

EARS-002 can add policy retrieval, a mock ERP client, and a review draft without a rewrite. The safe seam is the same shape as `readInvoiceForActor`: resolve the actor, reject, then load the record. Do not pass `invoices` or `policies` from `lib/seed.ts` into model context. Do not let the model choose a tenant id.

### D. Security assessment

This is simulated identity selection. The homepage lists every seeded employee, and submitting an employee id creates that person's session. That is not production authentication, SSO, or a control against someone who can open the app.

#### Authentication

Verified against `next start` on `http://127.0.0.1:3456` with `EARS_DEMO_SESSION_SECRET=review-session-secret-ok` (Node production mode):

1. Signatures are checked with HMAC-SHA256 and `timingSafeEqual` (`lib/session.ts` lines 62–82). A flipped signature returned 401.
2. A cookie signed with a different secret returned 401.
3. A manager token with `exp` in the past returned 401. The payload is not reissued by the client.
4. The signing secret was not in `Set-Cookie`, the login JSON, or `.next/static`.
5. `sessionSecret()` rejects an empty value, a value shorter than 16 characters, and the example value `replace-this-local-secret` (`lib/session.ts` lines 8–28). The unit test `refuses the example secret` passed in this review's `npm test` run. The running server used a non-example secret.
6. Login JSON that sent Avery's id plus `role: "manager"` and `tenantId: "tenant_summit"` returned `role: "analyst"` and `tenantId: "tenant_harbor"`. A valid analyst token that also carried `role: "manager"` still resolved to analyst.
7. `X-Role`, `X-Tenant-Id`, and `X-Employee-Id` without a cookie returned 401. The same headers with Avery's cookie did not reveal Jordan's invoice or the manager view.
8. Missing cookie on `/api/invoices/inv_harbor_50000` returned 401 with no amount and no vendor. The browser route redirects to `/`.
9. Production `Set-Cookie` was `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`. Chromium stored that Secure cookie on `http://127.0.0.1`, which is the documented local host. `npm run dev` does not set `Secure` because `NODE_ENV` is not production. That matches local HTTP.

Session fixation: login issues a new token. It does not accept a caller-supplied token.

CSRF: cookie is `SameSite=Lax`. Cross-site POSTs do not carry it. The state changes in this slice are choosing an identity and clearing the cookie. Invoice reads are not a cross-site write.

Logout: `DELETE /api/session` returns 200 and the UI sends the user to `/`. Replaying the old cookie still returns 200. The token is stateless and is not revoked. For this read-only demo, replay shows the same employee's invoices. It will be a real defect if EARS-003 treats logout as ending the authority to approve. See finding R01-03.

Unknown employee ids and non-string employee ids return 400. Unknown invoice ids return the same 403 body as a cross-tenant id.

#### Tenant isolation and authorization

Live results, not the unit tests:

- Avery reads `inv_harbor_50000` and receives `awaiting_analyst_review`.
- Avery receives 403 for `inv_harbor_1800` and for `inv_summit_9600`. The 403 body does not contain Lantern, Pine Ridge, `180000`, or `INV-SMT`.
- Avery `GET /api/invoices?view=oversight` and `view=evidence` return 403 without `INV-HBR-2026-0188`.
- Morgan's oversight list contains both Harbor invoices and not `INV-SMT`. Morgan `view=assigned` is 403. Morgan `POST /api/payments` is 403.
- Quinn remains an auditor when the login body says manager. Evidence stays inside Harbor. Oversight is 403. Approve is 403.
- Sam's rendered `/invoices/inv_harbor_50000` says Access denied and does not contain `$50,000.00`, `Cedar Office Supply`, or `INV-HBR-2026-0042`.

Manager and auditor invoice detail is allowed for Harbor invoices. That is the oversight and evidence read, not the analyst queue. The manager is denied `/invoices`. The auditor page says read-only and has no approve or pay control.

#### Forbidden financial operations

`POST /api/invoices/inv_harbor_50000/approve` returned `403 {"error":"operation_forbidden","operation":"approve"}` for the analyst and the auditor. A following read still said `awaiting_analyst_review`. `POST /api/payments` returned the same shape for pay. `GET /api/payments` returned 405. Source under `app/`, `lib/`, and `components/` has no Stripe, Plaid, SWIFT, routing number, or account number. The unit test that scans those trees passed again in this review. No payment credential is in the repo. This is an invoice viewer.

#### Dependency advisories

`npm audit --audit-level=critical` exited 1 on the committed lockfile. Installed versions: Next 15.5.28, PostCSS 8.4.31 (via Next) and 8.5.30 (via Vite), Vitest 3.2.7, Tinypool 1.1.1. `npm audit fix` without `--force` was not run. `--force` would move to Next 16.4.2 and Vitest 5.0.5. Next 15.5.28 is the newest 15.5 release, and its declared PostCSS dependency is still 8.4.31. There is no same-major lockfile bump that clears the audit.

| Package | Version | Advisory | Severity | Path | Range | Runtime? | Reachable here? | Nonbreaking fix | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| postcss | 8.4.31 | GHSA-qx2v-qp2m-jg93 | moderate | next → postcss | `<8.5.10` | Build-time CSS parser inside Next | No. CSS is the repo's `app/globals.css`, not invoice text. | No. Fixed Next is 16.4.2. | ACCEPT_WITH_DOCUMENTED_RISK |
| postcss | 8.4.31 | GHSA-6g55-p6wh-862q | high | next → postcss | `<=8.5.11` | Build-time file read from a CSS `sourceMappingURL` | No for a browser user. A malicious CSS comment would have to already be in the build input. | No same-major fix. | ACCEPT_WITH_DOCUMENTED_RISK |
| postcss | 8.4.31 | GHSA-fxqj-rqcc-2cmp | moderate | next → postcss | `<=8.5.22` | Same build-time map read when `from` is unset | Same as above. | No same-major fix. | ACCEPT_WITH_DOCUMENTED_RISK |
| postcss | 8.4.31 | GHSA-r28c-9q8g-f849 | high | next → postcss | `<=8.5.17` | Build-time `.map` disclosure | Same as above. | No same-major fix. | ACCEPT_WITH_DOCUMENTED_RISK |
| tinypool | 1.1.1 | GHSA-5gmw-xhrv-c9v3 | critical | vitest → tinypool | `<=2.1.0` | Dev test worker | No. Not imported by `next start`. Requires attacker-controlled worker options. | No. Fix is Vitest 5.0.5, a major upgrade. | ACCEPT_WITH_DOCUMENTED_RISK |
| tinypool | 1.1.1 | GHSA-85c8-ppgw-ccpr | critical | vitest → tinypool | `<2.1.2` | Dev test worker RCE gadget | Same. The demo server does not call Tinypool. | Vitest 5 major only. | ACCEPT_WITH_DOCUMENTED_RISK |
| @vitest/mocker and vitest | vitest 3.2.7 | GHSA-82fw-gwwq-j7x9 | moderate | vitest dev tree | `>=2.1.0 <4.1.11` | Dev-only mock redirect path read | No HTTP path. Requires a hostile Vitest mock redirect. | Vitest 5 major, or a future 4.1.x if published above 4.1.10. Audit's offered fix is 5.0.5. | ACCEPT_WITH_DOCUMENTED_RISK |

Vite's PostCSS 8.5.30 is outside the ranges above. The production copy that keeps the audit red is Next's 8.4.31.

Remediation plan: upgrade Next and Vitest when a tested major bump is its own work order. Do not use `npm audit fix --force` inside EARS-001. Re-audit at that upgrade. The critical advisories are not reachable by a demo HTTP client.

### E. Test evidence

Environment: macOS, Node `v22.22.0`, npm `10.9.4`. Working tree at `00eba687ce015d001dec0d3f3aa4d2b2874d6db2` before this report. `node_modules` was deleted, then `npm ci` used the committed lockfile. Playwright's Chromium was already installed on the machine. `npm ci` does not install browsers.

| Command | Exit | Result |
| --- | --- | --- |
| `npm ci` | 0 | 80 packages. Audit text reported 5 vulnerabilities. |
| `npm run typecheck` | 0 | `tsc --noEmit` |
| `npm test` | 0 | Vitest 3.2.7. 2 files, 11 tests passed. |
| `npm run test:e2e` | 0 | Playwright. 5 tests passed in 13.1s. Warning: `NO_COLOR` ignored because `FORCE_COLOR` is set. |
| `npm run build` | 0 | Next.js 15.5.28 compiled successfully. |
| `npm audit --audit-level=critical` | 1 | See section D. Not a pass. |

Hostile probe, exit 0, against `npm run start -- --hostname 127.0.0.1 --port 3456` after that build. The probe script was outside the repo (`/tmp/ears-probe.mjs`) and is not part of the application. It covered missing cookies, array and unknown employee ids, header spoofing, tampered and expired and cross-signed cookies, role smuggled inside a signed payload, unassigned and cross-tenant ids, view escalation, approve, pay, logout replay, manager and auditor API limits, the denied HTML body, and a browser pass: Avery to list to `INV-HBR-2026-0042` at `$50,000.00` with Cedar Office Supply LLC and Awaiting analyst review, browser Back to the list, Morgan denied `/invoices`, Quinn's detail read-only with no approve or pay button. The banner contained `DEMO — NOT PRODUCTION AUTH` and `Simulation only`.

GitHub Actions on SHA `00eba687ce015d001dec0d3f3aa4d2b2874d6db2`:

- EARS-001 checks, job `app`, run https://github.com/xcross20/EARS/actions/runs/38920791199 conclusion success. Log shows 11 unit tests passed and 5 Playwright tests passed. Build compiled.
- A second `app` run, `38920784990`, also completed success.
- Foundation document check completed success on both associated runs.
- CI does not run `npm audit`.

The builder report said CI had not been observed yet. That statement is stale. These Actions results were read from GitHub during this review.

### F. Findings

#### R01-01

- Severity: P2
- File: `lib/invoices.ts` lines 12–21
- Evidence: `invoicesForView` returns every same-tenant invoice when `view` is not `"assigned"`. It does not call `authorizeListView`. `app/api/invoices/route.ts` lines 24–26 and `components/InvoiceListView.tsx` lines 38–39 do call it. The live analyst request for `view=oversight` returned 403.
- Expected: the data function refuses a view the actor's role cannot open.
- Actual: safety depends on every caller. A missed check would list the other analyst's Harbor invoice.
- Impact: no current bypass. EARS-002 can trip it by calling the helper from a new route.
- Correction: return no rows, or throw, unless `authorizeListView(actor, view)` is true. Add a test that the helper and the route both reject analyst-to-oversight.
- Blocks acceptance: no.

#### R01-02

- Severity: P2
- File: `lib/seed.ts` lines 3–137
- Evidence: `tenants`, `employees`, `vendors`, `policies`, and `invoices` are exported. Authorization is a later filter.
- Expected: server code that needs a record asks a function which already has an actor.
- Actual: any module can import the other tenant's invoices.
- Impact: no current route does that. A model adapter that imports `invoices` would bypass the UI and the route checks.
- Correction: before EARS-002 tool calls, stop exporting the raw arrays. Keep `readInvoiceForActor` and add the same shape for policy and ERP reads.
- Blocks acceptance: no.

#### R01-03

- Severity: P3
- Files: `lib/session.ts` lines 47–59; `lib/demo-session-actions.ts` lines 28–31; `app/api/session/route.ts` lines 44–47
- Evidence: after `DELETE /api/session`, the same cookie value was sent again and `GET /api/session` returned 200.
- Expected for a revocable session: logout invalidates that token.
- Actual: logout deletes the browser cookie only. The HMAC remains valid until `exp`.
- Impact: a copied cookie can still read that employee's invoices. It cannot change role or tenant. There is no approval to replay.
- Correction: before EARS-003 mutations, store a server-side session version and reject logged-out tokens.
- Blocks acceptance: no.

#### R01-04

- Severity: P3
- Files: `.github/workflows/ci.yml` line 9; `playwright.config.ts` line 3
- Evidence: `ci-demo-session-secret` and `e2e-demo-session-secret` are in the repo. `sessionSecret()` does not reject them. They are not the default runtime secret. `.env.example` is rejected.
- Expected: a published string is not a usable signing key for anything but throwaway local or CI processes.
- Actual: anyone who starts the app with the CI value can mint cookies for that process.
- Impact: no deployed service uses this key. Impact is limited to a process whose operator copied the CI env.
- Correction: document that those values are public fixtures. Keep rejecting the example secret.
- Blocks acceptance: no.

#### R01-05

- Severity: P3
- File: `e2e/j001-slice.spec.ts`
- Evidence: the suite does not request `view=oversight` as the analyst or `view=assigned` as the manager. This review's probe did, and both returned 403. Expired cookies are covered in `tests/session.test.ts` and were also rejected over HTTP by the probe.
- Expected: the repo's own e2e fails if `authorizeListView` is removed from the list route.
- Actual: that regression would not be caught by the current e2e. The unit tests call `invoicesForView` only with the allowed view.
- Impact: coverage gap. Behavior itself was verified outside the suite.
- Correction: add those two requests to the e2e.
- Blocks acceptance: no.

No P0 or P1 finding.

### G. Known limitations

These are accepted demo constraints, not defects in EARS-001:

- Identity selection is public and simulated. It is labeled `DEMO — NOT PRODUCTION AUTH`.
- Data is an in-memory fixture. Restart restores it. Nothing is saved.
- Policy text is metadata. ERP, retrieval, and model review are EARS-002.
- Approval and payment routes only refuse. They are not the EARS-003 state machine.
- Logout does not revoke a copied cookie. Finding R01-03. Acceptable only while the product cannot approve or pay.
- PostCSS and Tinypool advisories remain, with the dispositions in section D.
- The picker shows employee names from both fictional tenants. It does not show the other tenant's invoices.

### H. Final verdict

`NO_MATERIAL_DEFECTS`

The EARS-001 browser journeys work. Server-side tenant and role checks held under hostile requests. No financial side effect exists. Tests and the production build passed. The audit failure has an explicit, bounded disposition. The P2 items are guards for EARS-002, not breaks in this slice.

### I. Controller recommendation

`CONTINUE`

The technical gate for this demo slice is met. This recommendation is not `ACCEPT` because the reviewer session also wrote the implementation. Recording ACCEPT from this file would be the builder closing its own work order. The Controller should not mark EARS-001 accepted, should not merge pull request 2, and should not start EARS-002 on the strength of this report alone.

A later Controller decision can be `ACCEPT` after a reviewer who did not author `23a268e5749fcb68c9e7bb80c46a02ffd4e51ba9` confirms the same behavior, or after the human owner accepts that limit. No application change is required for that confirmation. Findings R01-01 and R01-02 should be done before a model or ERP adapter reads records. Finding R01-03 should be done before any approval write.

Strategy does not need a rethink. The single-app seam is the right one.
