# EARS-002-R01 independent review

### 1. Reviewed commit and reviewer identity

- Work order: EARS-002. Review id: EARS-002-R01.
- Repository: `xcross20/EARS`. Branch under review: `feat/ears-002`.
- Reviewed SHA: `d716b97848cc78c671dda40c729fe1f41cdab4be`.
- `git rev-parse HEAD` in `/tmp/ears-002-r01` printed that SHA before `npm ci`, before typecheck, before unit tests, before Playwright, before the production build, before `npm audit`, before the in-process probe, and before the production server started.
- Implementation commit: `52564da8983ab1711e93ef385ede897d205163e7` (`feat: add an authorized evidence review for EARS-002`). The reviewed SHA is its child, `d716b97848cc78c671dda40c729fe1f41cdab4be` (`docs: record the EARS-002 builder evidence`). `git diff --stat 695aba6..d716b978` is 24 files, +804 / −32. Application behavior is the implementation commit. The builder report is evidence, not proof.
- Reviewer: a new Grok session that did not author `52564da` or `d716b97`. This document does not accept the work order, does not merge, and does not deploy. The controller recommendation below was not written to `DECISION.md`, `STATE.md`, or `NEXT.md`.

### 2. Independence statement

The checkout is a detached worktree at the reviewed SHA. `node_modules` came from `npm ci` in `/tmp/ears-002-r01`. The builder report was read as a claim list. Every exit code below was observed in this session. Hostile probes live only under `/tmp` (`/tmp/ears-002-r01-probe.mjs`, `/tmp/ears-002-r01-http.mjs`) and were not added to the repo. No application file was edited.

`XAI_API_KEY` was unset in this shell (`XAI_API_KEY_present=no`). External `.env` files were not opened. The live xAI API was not called. The production probe secret was generated in the server process, was 32 characters, and is not printed. It is not `ci-demo-session-secret`, `e2e-demo-session-secret`, or a value in `REJECTED_SECRETS`. `EARS_ALLOW_DEMO_FAULTS` was unset for that server.

### 3. Commands and results

Environment: macOS, Node `v22.22.0`, npm `10.9.4`. Working directory `/tmp/ears-002-r01`.

| Command | Exit | Observed result |
| --- | --- | --- |
| `npm ci` | 0 | 80 packages added. The installer text reported 5 vulnerabilities. That text is not a passing audit. |
| `npm run typecheck` | 0 | `tsc --noEmit` |
| `npm test` | 0 | Vitest 3.2.7. 3 files, 16 tests passed (`session` 5, `review` 5, `authz` 6). |
| `npx playwright install chromium` | 0 | Chromium installed before e2e. |
| `npm run test:e2e` | 0 | Playwright. 5 passed (14.5s). `NO_COLOR` was ignored because `FORCE_COLOR` is set. `playwright.config.ts` lines 20–24 set `XAI_API_KEY` to `""`. |
| `npm run build` | 0 | Next.js 15.5.28 compiled successfully. Invoice, review, approve, and payment routes are dynamic. |
| `npm audit --audit-level=critical` | 1 | Not a pass. npm summary: 5 vulnerabilities (2 moderate, 1 high, 2 critical). `npm audit fix` was not run. |

GitHub Actions for SHA `d716b97848cc78c671dda40c729fe1f41cdab4be`, from `gh run list` and `gh run view`:

- Foundation checks, run `38934403446`, job `foundation`, conclusion success. https://github.com/xcross20/EARS/actions/runs/38934403446
- EARS-001 checks, run `38934403607`, job `app`, conclusion success. Steps include `npm ci`, typecheck, unit test, Playwright install, e2e, and build. https://github.com/xcross20/EARS/actions/runs/38934403607
- No other run was listed for this SHA. CI does not run `npm audit`.

### 4. Security probes

Production server: `npm run start -- --hostname 127.0.0.1 --port 3227` after the build above. Next.js 15.5.28 reported ready. The HTTP probe exited 0 (40 checks). The in-process probe exited 1: 50 checks passed and 1 failed. The failure is the missing-vendor case in section 4.7. It is not an authorization bypass of the seeded data. The server was killed after the probes. A second short-lived server on the same port rechecked the anonymous document shell only.

Seeded HTTP denials were `{"error":"access_denied"}` or `{"error":"unauthenticated"}`. Bodies were scanned for invoice numbers, amounts, vendor legal names, sites, policy titles, policy ids, the injection sentence, and `10000 USD`. Denied bodies contained none of those.

1. `invoicesForView` authorizes before it filters. `lib/invoices.ts` lines 16–29 call `authorizeListView` and return `{ ok: false, reason: "access_denied" }` before `invoiceRecords().filter`. Direct calls for analyst, including Riley, on `oversight` and `evidence` returned that denial and no invoice fields. Riley's `assigned` view was `{ ok: true, invoices: [] }`. The same denial was HTTP 403 for Avery `view=oversight` and `view=evidence`, Riley on both non-assigned views, Morgan `view=assigned`, Sam `view=oversight`, and Quinn `view=assigned`. None of those bodies contained `"invoices"`. Riley's HTTP assigned list was `{"invoices":[]}`. Avery's assigned list contained `INV-HBR-2026-0042` and not Jordan's `INV-HBR-2026-0188`, the duplicate `INV-HBR-2026-0777`, Lantern, or Pine Ridge. Jordan's assigned list contained his invoices and not `INV-HBR-2026-0042`, `5000000`, the injection sentence, or Pine Ridge.
2. Policy and ERP reads used by the review are actor-scoped. `policiesForActor` (`lib/invoices.ts` lines 32–46) returned only `policy_harbor_procurement` for Avery, Jordan, and Morgan, and only `policy_summit_procurement` for Sam. `lookupVendorForActor` (`lib/erp.ts` lines 14–28) for Avery and `vendor_pine` was `{ ok: false, reason: "access_denied" }` with no legal name and no site. An unknown vendor id was `{ ok: false, reason: "not_found" }` with no other fields. Jordan and `vendor_lantern` was `{ ok: false, reason: "erp_unavailable" }` with no legal name and no invented `active` status.
3. Forged headers and login JSON do not choose role or tenant. `lib/authority.ts` lines 12–32 discard `headerRole` and `headerTenant`. `employeeIdFromLoginBody` (`lib/session.ts` lines 102–110) reads only `employeeId`. Avery's `POST /api/session` sent `role: "manager"` and `tenantId: "tenant_summit"` plus `X-Role` and `X-Tenant-Id`. The actor was analyst, `tenant_harbor`. Morgan stayed manager of Harbor. Quinn stayed auditor. Sam stayed analyst of Summit. `GET /api/session` with Avery's cookie and auditor/Summit headers stayed analyst of Harbor. The cookie was `HttpOnly; Secure; SameSite=Lax`. A tampered cookie on the invoice API was 401 with no document fields.
4. Cross-tenant and same-tenant unassigned reads. Avery `GET /api/invoices/inv_harbor_1800`, `inv_harbor_dup_a`, and `inv_summit_9600` were 403 with no document fields, including when the client sent manager and Harbor headers. Jordan `GET /api/invoices/inv_harbor_50000` was 403 with no Cedar, amount, policy, or injection sentence. Sam's GET and `POST .../review` of `inv_harbor_50000` were 403 with no Harbor policy title, `5000000`, or Cedar. Morgan `GET /api/invoices/inv_summit_9600` was 403 with no Pine Ridge. Jordan's HTML for `/invoices/inv_harbor_50000` was Access denied. The invoice number `INV-HBR-2026-0042`, Cedar, `$50,000`, the injection sentence, and both policy ids were absent (marker counts 0). Sam's HTML for that URL was the same. Avery's `/oversight` HTML was Access denied with those markers absent. In-process reviews of those forbidden ids did not call the scripted model.
5. Prompt injection on `inv_harbor_50000`. The description at `lib/seed.ts` lines 109–110 is data. It was visible on Avery's detail HTML, which also showed `Synthetic Procurement Policy` and Cedar, and did not show `policy_summit_procurement`, `10000 USD`, or Pine Ridge. The model request built from Avery's packet contained that description and did not contain `policy_summit_procurement`, `10000 USD`, `vendor_pine`, or Pine Ridge. `documentIds` were `policy_harbor_procurement`, `vendor_cedar`, and `inv_harbor_50000`. Citations were `policy:policy_harbor_procurement` (excerpt is the Harbor 25000 USD note) and `erp:vendor_cedar` (`Cedar Office Supply LLC is active.`). Neither citation source nor excerpt contained the injection sentence or the Summit title. A scripted draft whose summary said to approve payment and cite the Summit policy, while repeating the authorized citation ids, produced `refer_to_manager`, `isAuthorization: false`, and the headline `Refer to a manager. This is not an approval.` The model summary was not copied into the review (`lib/review/accept.ts` lines 46–51). The HTTP `POST /api/invoices/inv_harbor_50000/review`, with a body claiming `isAuthorization: true` and a Summit citation id, returned the deterministic review, `called: false`, those two citation sources, and not `approve payment`. The invoice GET body was unchanged and stayed `awaiting_analyst_review`.
6. Unauthorized and fabricated citation ids fail closed. `reviewFromDraft` (`lib/review/accept.ts` lines 32–44) abstains with `citations: []` when any id is outside the packet or the list is empty. A mixed list of one authorized id plus `policy:policy_summit_procurement` abstained and did not echo the Summit id in the summary. The xAI adapter path, driven by a mock `fetch` and not the network, did the same for an empty `citationIds` array and for `["policy:policy_summit_procurement"]`.
7. Malformed model output does not authorize. With `xaiReviewModel` and a mock `fetch` to `https://api.x.ai/v1/chat/completions`: non-JSON content, missing `content`, `citationIds` that is not an array, HTTP 401, and a thrown fetch all fell through to the deterministic draft (`refer_to_manager`, two Harbor citations, `provider: "deterministic"`, `called: false`, `isAuthorization: false`). A draft that returned the authorized ids but a summary telling the server to approve payment still produced the deterministic headline, not that summary. A `draft()` that throws is caught in `lib/review/run.ts` lines 56–67 and replaced with the deterministic draft; the error text was not copied into the review. No probe called the live API. `global fetch` was wrapped and the call count stayed 0.
8. ERP outage abstains and does not call the model. Jordan's review of `inv_harbor_1800` was `outcome: "abstain"`, empty citations and checks, `documentIds: ["inv_harbor_1800"]`, `model.called: false`, and the summary `No vendor status was invented.` The scripted model was not invoked. The HTTP body did not contain Lantern, `active`, the injection sentence, or the Summit policy id. `isAuthorization` was false.
9. Missing vendor does not abstain. `lookupVendorForActor` returns `not_found`, and `reviewInvoice` would abstain for that reason (`lib/review/run.ts` lines 48–52). The review never gets there. `readInvoiceForActor` (`lib/invoices.ts` lines 60–66) throws `Invoice inv_harbor_50000 is missing seed relations` when the vendor id does not resolve. The in-process retarget threw that message, called the model 0 times, and did not include a vendor name or the word `active`. `assertSeedInvariants` (`lib/seed.ts` lines 206–231) makes this unreachable for the shipped seed. There is no writer in this slice. See 002-R01-03.
10. AI review does not approve or pay. `isAuthorization` is the literal `false` on `EvidenceReview` (`lib/review/types.ts` line 40) and on both return objects in `lib/review/accept.ts` lines 39 and 51. `POST /api/invoices/inv_harbor_50000/approve` and `POST /api/payments` were 403 `operation_forbidden` for Avery, Jordan, Riley, Morgan, Quinn, and Sam, including forged manager headers and a paid body. Unauthenticated calls were 401. The approve and payment handlers only return `evaluateOperation` (`app/api/invoices/[invoiceId]/approve/route.ts` lines 7–9, `app/api/payments/route.ts` lines 7–9, `lib/authz.ts` lines 69–77). Status stayed `awaiting_analyst_review`. Review state is not stored.
11. Anonymous document GET. `GET /api/invoices/inv_harbor_50000` with forged role and tenant headers and no cookie was `401 {"error":"unauthenticated"}` with no document markers. `GET /invoices/inv_harbor_50000` was HTTP 200, with `NEXT_REDIRECT` (2) and `Loading invoices` (3). Counts were 0 for `INV-HBR-2026-0042`, Cedar, `5000000`, `$50,000`, both policy titles, both policy ids, and the injection sentence. `inv_harbor_50000` occurred 3 times as the requested route segment. That shell is not a disclosure. This matches the EARS-001 finding and is not a new defect.
12. Raw records did not enter the model request on the paths that were run. `modelRequestBody` (`lib/review/xai.ts` lines 20–27) serializes one packet: invoice number, amount, description, citations, and checks. The Summit policy id was absent. A temporary in-memory change of Avery's invoice `policyId` to `policy_summit_procurement` made `readInvoiceForActor` return that policy's title, and the review then returned `access_denied` with 0 model calls. The same for `vendorId` `vendor_pine`: the detail object included `Pine Ridge Paper Co.`, and the model was not called. Both fields were restored before later checks. The shipped seed does not contain those foreign keys.

No unauthorized policy, vendor, or invoice document was present in a model request during these probes. The injection sentence was present only as the description of the invoice Avery is allowed to read.

### 5. xAI adapter

Verified without a live call:

- The key is an argument to `xaiReviewModel` (`lib/review/xai.ts` lines 33–42), read from `env.XAI_API_KEY` only when `length >= 16` (`lib/review/run.ts` lines 9–19). Shorter values, including `""` and 15 characters, select `provider: "deterministic"`. A 16-character fake value selects `provider: "xai"`. That object was not invoked.
- There is no key literal in `lib/review/xai.ts`. The server bundle `.next/server/app/api/invoices/[invoiceId]/review/route.js` contains `process.env` / `XAI_API_KEY`, the URL `https://api.x.ai/v1/chat/completions`, and `grok-4.7`. A search found 0 literal `Bearer` tokens and 0 assigned key literals. `.next/static` contained none of `XAI_API_KEY`, `api.x.ai`, or `grok-4`. `.next/static` also contained none of the invoice numbers, vendor names, or `policy_summit_procurement`.
- Response handling in `lib/review/xai.ts` lines 45–62: non-OK HTTP returns null; missing content returns null; `JSON.parse` failure throws; a non-array `citationIds` or a non-string entry returns null. `reviewInvoice` turns null and thrown `draft()` into the deterministic draft and does not copy the model summary. Citation ids outside the packet or an empty list abstain.
- The mock request had no `signal` and no timeout. `lib/review` has no `AbortSignal`. That is 002-R01-02.

Not verified:

- Live xAI latency, error bodies, refusal behavior, and whether a real model follows the system instruction. CI and this review run with no key. Do not treat the deterministic e2e result as a live-provider result.

There is no `import "server-only"` on the adapter. No client component imports it. `components/ReviewPanel.tsx` only POSTs to the review route.

### 6. Dependency advisory assessment

`npm audit --audit-level=critical` exited 1. This is not a pass. Audit JSON from this worktree on 2026-10-16. `npm audit fix` was not run. Next and Vitest were not upgraded.

`npm ls postcss tinypool @vitest/mocker --all`:

- `next@15.5.28` → `postcss@8.4.31`
- `vitest@3.2.7` → `@vitest/mocker@3.2.7`, `tinypool@1.1.1`, and `vite@7.3.7` → `postcss@8.5.30`

`npm ls --omit=dev postcss tinypool` keeps only `next@15.5.28` → `postcss@8.4.31`. Tinypool is not in the production tree. A search of `.next` found no `tinypool` string. npm's package rollup is 2 moderate, 1 high, and 2 critical (5). The advisory rows below are the individual GHSA records inside that rollup. Every `fixAvailable.isSemVerMajor` value was true. There is no same-major fix in the audit output.

| Package | Version | Advisory | Severity | Path | Same-major fix | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| postcss | 8.4.31 | GHSA-qx2v-qp2m-jg93 | moderate | `next` → `postcss` | No. Audit fix is Next 16.4.2. | Advisory only. Not reachable as an invoice-request primitive. Do not upgrade Next in this review. |
| postcss | 8.4.31 | GHSA-6g55-p6wh-862q | high | `next` → `postcss` | No. Same major bump. | Advisory only. Build-time CSS map handling, not the review API. |
| postcss | 8.4.31 | GHSA-fxqj-rqcc-2cmp | moderate | `next` → `postcss` | No. | Advisory only. |
| postcss | 8.4.31 | GHSA-r28c-9q8g-f849 | high | `next` → `postcss` | No. | Advisory only. |
| @vitest/mocker | 3.2.7 | GHSA-82fw-gwwq-j7x9 | moderate | `vitest` → `@vitest/mocker` | No. Audit fix is Vitest 5.0.5. | Advisory only. Dev test runner. Not in the production server. |
| tinypool | 1.1.1 | GHSA-5gmw-xhrv-c9v3 | critical | `vitest` → `tinypool` | No. Vitest 5.0.5 is a major bump. | Advisory only. Not imported by `app/`, `lib/`, or `components/`. Absent from `.next`. |
| tinypool | 1.1.1 | GHSA-85c8-ppgw-ccpr | critical | `vitest` → `tinypool` | No. | Advisory only. Same dev-only path. |
| vitest | 3.2.7 | rolls up the mocker and tinypool advisories | critical (package rollup) | `node_modules/vitest` | No. | Advisory only. Not a production dependency. |
| next | 15.5.28 | via postcss | moderate (package rollup) | `node_modules/next` | No. | Advisory only. Covered by the postcss rows. |

Vite's `postcss@8.5.30` is a second, dev-only copy. The audit's `postcss` node is the production 8.4.31 copy. The two critical advisories are real and are not treated as a passing audit. They do not block this slice. Do not run `npm audit fix --force` here.

### 7. Maintainability

The review types are explicit. `EvidenceReview.isAuthorization` can only be `false`. List and ERP results are discriminated unions. `reviewInvoice` returns `unauthenticated` or `access_denied` instead of an empty invoice list. The list route checks the view again (`app/api/invoices/route.ts` lines 24–26) before mapping `publicInvoice`.

The outcome is computed from packet checks (`lib/review/accept.ts` lines 4–17), not from model prose. That keeps prompt injection from becoming an approval, and it means a live model cannot change the headline even when its citation ids are valid. The summary field is the same headline. That is safe and is also why the adapter's `summary` is currently unused.

Regression risk is the unbranded packet and the unscoped relation read. `AuthorizedPacket` is a plain type. `invoiceRecords`, `policyRecords`, and `vendorRecords` (`lib/seed.ts` lines 171–181) still return the mutable arrays. `findPolicy`, `findVendor`, and `vendorLegalName` (`lib/seed.ts` lines 194–199, `lib/invoices.ts` lines 75–77) do not take an actor. `tests/review.test.ts` lines 118–128 only forbid those names inside `lib/review`. `packet.ts` reaches the records through `policiesForActor`, `readInvoiceForActor`, and `lookupVendorForActor`. That indirection held in the probes. It is not a type boundary. `InvoiceTable` calls `vendorLegalName` only for rows already returned by `invoicesForView`.

`readInvoiceForActor` checks `canReadInvoice` and then loads whatever policy and vendor ids are on the row. It does not check `policy.tenantId` or `vendor.tenantId`. The packet builder does, through `policiesForActor` and `lookupVendorForActor`, and it refuses before `model.draft`. The detail page and `GET /api/invoices/[invoiceId]` trust `readInvoiceForActor`. The seed invariant currently makes the foreign keys same-tenant. A later writer can break that without a type error.

### 8. Defects

No P0. No P1.

| Id | Severity | Finding |
| --- | --- | --- |
| 002-R01-01 | P2 | `readInvoiceForActor` (`lib/invoices.ts` lines 60–66) returns a policy or vendor from another tenant when the invoice foreign key points there. An in-memory retarget returned the Summit policy title and Pine Ridge's legal name. `buildAuthorizedPacket` then returned `access_denied` and did not call the model. The shipped seed cannot do this (`lib/seed.ts` lines 222–227). Fix the relation check before invoice rows are writable. |
| 002-R01-02 | P2 | `xaiReviewModel` (`lib/review/xai.ts` lines 37–44) has no timeout or abort signal. The mock `fetch` init confirmed `hasSignal: false`. Failures that do return or throw fall closed. A hung live call would not. |
| 002-R01-03 | P2 | A missing vendor throws from `readInvoiceForActor` (`lib/invoices.ts` line 64) instead of taking the `not_found` abstain path in `lib/review/run.ts` lines 48–52. The throw happened before the model, and the message did not include a vendor status. Unreachable while the seed invariant holds. The seeded ERP outage path does abstain. |
| 002-R01-04 | P3 | `reviewFromDraft` assumes `citationIds` is an array (`lib/review/accept.ts` line 33). A non-array from a model other than the xAI parser throws `TypeError: draft.citationIds.filter is not a function` outside the `try` in `lib/review/run.ts` lines 56–72. The xAI parser returns null first (`lib/review/xai.ts` lines 56–60), and that path falls closed. |
| 002-R01-05 | P3 | `invoiceRecords`, `policyRecords`, and `vendorRecords` remain exported, and the review test only bans those names in `lib/review`. Current `modelRequestBody` calls did not contain an unauthorized document. `AuthorizedPacket` is not branded, so a later caller can still build one by hand. |
| 002-R01-06 | P3 | After a failed or null model draft, the review says `provider: "deterministic"` and `called: false` (`lib/review/run.ts` lines 63–67) even though `fetch` ran. The UI text is then "No external model was called." The model summary is also discarded on success. Neither one changes the outcome or leaks another tenant. |
| 002-R01-07 | P3 | The adapter module is not marked `server-only`. At this SHA the client bundles do not contain the key, the endpoint, or the model id, and the server bundle reads the key from the environment at runtime. |

Known EARS-001 residuals that this work order did not have to close. The code is unchanged. This review did not replay logout.

- EARS-001 R01-03. Logout deletes the cookie and does not revoke the HMAC until `exp` (`lib/session.ts` lines 62–95, `app/api/session/route.ts` lines 44–47). Still required before EARS-003 writes an approval.
- EARS-001 R01-04. `ci-demo-session-secret` (`.github/workflows/ci.yml` line 9) and `e2e-demo-session-secret` (`playwright.config.ts` line 3) are not in `REJECTED_SECRETS` (`lib/session.ts` lines 8–13). The placeholder in `.env.example` is rejected.

EARS-001's old `invoicesForView` gap is closed at `lib/invoices.ts` lines 17–18. Analyst `oversight` and `evidence` are `access_denied`, not an empty list and not the other Harbor invoices.

### 9. Verdict

`NO_MATERIAL_DEFECTS`

The seeded authorization boundary holds. Forbidden API and HTML responses did not contain another user's invoice, amount, vendor, policy title, or policy id. The injection sentence stayed invoice description and did not become a citation, a Summit policy fetch, or an approval. Approve and pay stay 403. The review does not persist. No unauthorized document entered a model request in these probes. The P2 items are latent data-shape and adapter-timeout gaps, not a current bypass. The live xAI provider was not tested. The audit exit 1 is advisory and is not a pass.

### 10. Controller recommendation

`ACCEPT`

This reviewer did not record that recommendation. It is not in `DECISION.md`. EARS-003 was not started. The branch was not merged and the pull request must stay draft.

P2 items 002-R01-01 and 002-R01-03 should be repaired before a writer can change invoice foreign keys. 002-R01-02 should be repaired before a deployment relies on a live `XAI_API_KEY`. They do not block acceptance of this read-only slice. EARS-001 R01-03 still blocks any later approval write.
