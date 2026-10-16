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

