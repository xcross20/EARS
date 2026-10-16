# Decision ledger
## Bootstrap
- Decision: establish mission/strategy/governance and first user journey before implementation.
- Status: documentation bootstrap only; not an accepted implementation cycle.
- Rationale: avoid infrastructure-first overengineering.

## EARS-001 — Controller decision (2026-10-16)
- **Decision:** ACCEPT — EARS-001 only. This does not approve merge, deployment, or execution of EARS-002.
- **Implementation branch:** `feat/ears-001-app`; reviewed implementation SHA: `00eba687ce015d001dec0d3f3aa4d2b2874d6db2`.
- **Builder:** implementation `23a268e5749fcb68c9e7bb80c46a02ffd4e51ba9`; builder evidence `2df08f3715b34086e2b939b1676f72d8725faa8d` and `00eba687ce015d001dec0d3f3aa4d2b2874d6db2`.
- **First review:** `research/autonomous/EARS-001-review.md`, review branch `review/ears-001-r01`, commit `41614fe2b2e634ab239e1d2044a7397e1df63d29`; `NO_MATERIAL_DEFECTS`, but not independent because same session authored implementation. Not used as sole acceptance evidence.
- **Independent verifier:** separate Grok session; `research/autonomous/EARS-001-independent-verification.md`, branch `verify/ears-001-r02`, commit `63ea635dbe43f0734a7c2f46e49aa6fa0cd081ff`; verdict `NO_MATERIAL_DEFECTS`, recommendation `ACCEPT`. Review performed in detached clean worktree at reviewed SHA.
- **Verified checks (R02):** `npm ci` exit 0; `npm run typecheck` exit 0; `npm test` exit 0 (11); `npx playwright install chromium` exit 0; `npm run test:e2e` exit 0 (5); `npm run build` exit 0; `npm audit --audit-level=critical` exit 1. GitHub Actions for reviewed SHA reported successful.
- **Security:** server-derived tenant/role, tampered/expired cookie rejection, cross-tenant and unassigned invoice denial, forbidden approve/pay, and denied role views independently verified. Synthetic demo only; no production auth.
- **Residual risks:** PostCSS (production build-time) and Tinypool (dev/test-only) advisories remain **ACCEPT_WITH_DOCUMENTED_RISK**, not a passing audit; reevaluate before public deployment. R01-01/R01-02 actor-scoped data-access hardening is a mandatory EARS-002 entry condition. R01-03 session revocation is required before EARS-003 write/approval authority. R01-04/05 are nonblocking documentation/test improvements.
- **Rationale:** EARS-001 meets its bounded read-only demo acceptance criteria; independent verification removes R01's reviewer-independence blocker. The remaining issues do not block this slice but constrain future work.
- **Next:** EARS-002 QUEUED / READY_FOR_BUILDER only after human operator chooses to start; no auto-run.
- **Authority boundary:** Controller decision records engineering acceptance only. Human owner retains merge/deploy authority. PR #2, PR #3, PR #4 remain separate and require appropriate integration/review.

## Controller decision schema
Record: work_order, branch, builder_commit, reviewer_identity, checks_with_commands_and_exit_codes, defects, decision (CONTINUE/ACCEPT/BLOCKED/RETHINK), rationale, next_work_order.

## EARS-002 — Controller decision (2026-10-16)
- **Decision:** ACCEPT for EARS-002 engineering scope only; no merge, deployment, or EARS-003 execution authorized.
- **Implementation:** `feat/ears-002`, implementation `52564da8983ab1711e93ef385ede897d205163e7`, reviewed/evidence SHA `d716b97848cc78c671dda40c729fe1f41cdab4be`.
- **Builder evidence:** `research/autonomous/EARS-002-builder-report.md` on implementation branch.
- **Independent reviewer:** separate Grok session, detached worktree `/tmp/ears-002-r01`, report `research/autonomous/EARS-002-independent-review.md` on `review/ears-002-r01` at `ded4aeb3b313cc10e568fd6d076686e27fc9e907`. Verdict `NO_MATERIAL_DEFECTS`, recommendation `ACCEPT`.
- **Verified checks:** `npm ci` 0; `npm run typecheck` 0; `npm test` 0 (16); `npx playwright install chromium` 0; `npm run test:e2e` 0 (5); `npm run build` 0; `npm audit --audit-level=critical` 1. CI for reviewed SHA succeeded (runs 38934403446 and 38934403607). CI does not run npm audit.
- **Security evidence:** 40 hostile HTTP checks passed; unauthorized reads and model context leakage not observed; injected invoice instructions do not grant authorization; unauthorized/fabricated citation ids abstain; ERP outage abstains; approve/pay remain 403 and `isAuthorization` false. In-process probe had one failed assertion for a missing-vendor exception, recorded as P2, not concealed.
- **Unverified:** live xAI call was not made; provider latency and actual model behavior are unverified. The default deterministic fallback is verified.
- **Risk disposition:** unchanged PostCSS and Tinypool/@vitest/mocker advisories `ACCEPT_WITH_DOCUMENTED_RISK` for this synthetic demo; audit remains failing, must be revisited before deployment.
- **Carry-forward P2:** validate invoice foreign-key tenant integrity at the data boundary; xAI fetch timeout; missing-vendor failure must abstain rather than throw.
- **Carry-forward P3:** robust non-array citation input handling; distinguish failed-model fallback from no-key deterministic execution; mark provider adapter server-only; restrict raw seed access; maintain regression tests.
- **EARS-003 hard gate:** implement server-side revocable sessions before approval writes; enforce tenant integrity and robust failure behavior before enabling any mutation. Retain explicit human approval and no payment execution.
- **Rationale:** bounded evidence-grounded review meets EARS-002 acceptance criteria with independently verified trust boundaries. Deferred defects do not create a demonstrated current bypass, but are prerequisites for later authority.
- **Next:** EARS-003 queued, not started. Human owner controls merge and deployment.

## EARS-003 — Controller decision (2026-10-16)
- **Decision:** ACCEPT for the EARS-003 engineering scope only. This does not authorize merge, deployment, payment execution, or another product work order.
- **Reviewed SHA:** `02392bea6d73a49aacc10cdcd25420ca1ca27fd3` on `repair/ears-003-durability`. Parent `1c84e36f768b7723f990911fdbd4b91cdd20a46b`. Implementation before the repair: `3ef495e2db19f9975dd043f2f38b618157dbc7d8`.
- **Cycle 001:** CONTINUE. Independent reviewer session `01a14631-0116-7471-a830-5a230e886a75`, detached worktree `/tmp/ears-003-r01`. P1 `EARS-003-DURABILITY`: the in-memory approval store did not survive a new process. Security probes passed, including one single-process approve/reject race. `npm audit --audit-level=critical` exited 1.
- **Repair:** one attempt. File persistence for workflow cases, audit events, idempotency, and session revocation. No dependency upgrade. Controller rules were not part of the repair.
- **Cycle 002:** independent reviewer session `01a14644-5e16-7df0-902a-37f8b689abbd`, detached worktree `/tmp/ears-003-r02`. Product recommendation `NO_MATERIAL_DEFECTS`. That sentence was not the acceptance evidence.
- **Deterministic gate:** `lib/autonomy/gate.ts` `evaluateEvidence` returned ACCEPT for the cycle 002 artifacts. Evidence pack commit: `01e20628d7cf593ca5a56d96f875d0369196d11e` on `autonomy/ears-aut-001`, paths `research/autonomous/cycles/EARS-AUT-001/cycle-001/` and `cycle-002/`.
- **Checks on the reviewed SHA:** `npm ci` 0; `npm run typecheck` 0; `npm test` 0 (21); `npx playwright install chromium` 0; `npm run test:e2e` 0 (6); `npm run build` 0; `npm audit --audit-level=critical` 1. The controller re-ran the audit: exit 1, advisories `GHSA-qx2v-qp2m-jg93`, `GHSA-6g55-p6wh-862q`, `GHSA-fxqj-rqcc-2cmp`, `GHSA-r28c-9q8g-f849`, `GHSA-82fw-gwwq-j7x9`, `GHSA-5gmw-xhrv-c9v3`, `GHSA-85c8-ppgw-ccpr`. Two critical, one high, two moderate. This is `ACCEPT_WITH_DOCUMENTED_RISK` for the synthetic demo, not a passing audit. No `npm audit fix --force`.
- **Restart:** controller process check, separate from the reviewer. Submit `evt_FbQ-5ZzchOHa` and approve `evt_9xutvccCeMJz` with rationale `Controller restart check. No payment.` were still returned after a new process. The revoked analyst cookie then received 401 for session, submit, decision, and `GET /api/audit` after another new process. State files did not contain the session secret. `POST /api/payments` returned 403.
- **Other security evidence from the independent review:** forged role and tenant headers did not elevate; cross-tenant reads and decisions were denied; an unassigned analyst could not submit; injected invoice text did not authorize; unauthorized citations were excluded; a missing vendor abstained; malformed citation arrays failed closed; provider fallback stayed distinct from no-key deterministic mode; the xAI adapter is server-only with a bounded timeout and was not called live; legacy approve and audit writes stayed forbidden; duplicate submit, repeated rationale, conflicting decision, stale version, self-approval, and auditor mutation were rejected. Single-process concurrent approve/reject committed one terminal outcome.
- **Residuals:** no cross-process lock; a crash between the separate state writes was not tested; local JSON is not a tamper-proof audit log; `ci-demo-session-secret` and `e2e-demo-session-secret` remain accepted demo secrets; live xAI was not called; demo auth is not production SSO.
- **Rationale:** the reviewed SHA meets the EARS-003 workflow and the restart requirement that blocked cycle 001, with the residuals above still in force.
- **Next:** `J001_COMPLETE — AWAITING_NEXT_APPROVED_MISSION`.
- **Authority boundary:** human owner retains merge and deployment. This ledger commit must not be duplicated for the same SHA.

