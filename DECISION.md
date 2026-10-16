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
