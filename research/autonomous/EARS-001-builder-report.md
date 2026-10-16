# EARS-001 builder report

**Role:** Builder. This report does not accept the work order.
**Branch:** `feat/ears-001-app`
**Base:** `feat/ears-001-foundation` at `d9e2d4df9f4a60c19b5e9d0fe57a668e33873916`
**Implementation commit:** `23a268e5749fcb68c9e7bb80c46a02ffd4e51ba9`
**Evidence commit:** recorded by the commit that adds this file. `NEXT.md` stays `READY_FOR_BUILDER`. No ACCEPT entry was written to `DECISION.md`.

## What was implemented
One Next.js TypeScript app. Decision and tradeoffs: `docs/adr/0001-next-fullstack-slice.md`.

- Identity screen labeled `DEMO — NOT PRODUCTION AUTH` and `Simulation only`.
- Server-issued httpOnly HMAC cookie. Payload is employee id and expiry. Role and tenant are read from the seed.
- Seeded tenants Harbor Ledger Mutual and Summit Glass Insurance. Invoice `INV-HBR-2026-0042` is `5_000_000` cents (`$50,000.00`), vendor Cedar Office Supply LLC, policy metadata only.
- Analyst list, manager oversight, and auditor evidence are different routes. The wrong role gets an access-denied page.
- `POST /api/invoices/:id/approve` and `POST /api/payments` return 403 `operation_forbidden` for every signed-in role. They do not call a payment network.

## Commands and exit codes
Working directory: `/Users/immanuellewis/worktrees/EARS`. Node `v22.22.0`. npm `10.9.4`. Run after the final source edit on 2026-10-16.

| Command | Exit |
| --- | --- |
| `npm install` (lockfile creation, earlier in the session) | 0 |
| `npm run typecheck` | 0 |
| `npm test` | 0 |
| `npm run test:e2e` | 0 |
| `npm run build` | 0 |
| `npm audit --audit-level=critical` | 1 |

`npm test` reported Vitest v3.2.7: 2 files, 11 tests, all passed.

`npm run test:e2e` reported Playwright: 5 tests, all passed, 11.4s. The Playwright web server command is `npm run build && npm run start -- --hostname 127.0.0.1 --port 3000`.

`npm run build` reported Next.js 15.5.28, compiled successfully.

`npm audit` exit 1 is an upstream advisory result, not an application test failure. It names `postcss` through Next 15.5.28 (high) and `tinypool` through Vitest 3.2.7 (critical). `npm audit fix --force` would jump to Next 16 and Vitest 5. That upgrade was not applied. CI does not treat `npm audit` as a gate.

An earlier `npm run test:e2e` before `outputFileTracingRoot` was set also passed 5 tests (15.5s) and printed a workspace-root warning. The recorded run above is the one after that config change. Its log did not repeat the warning.

## Negative security checks
Unit (`tests/authz.test.ts`, `tests/session.test.ts`):

- Tampered HMAC and expired cookie do not resolve.
- Example secret `replace-this-local-secret` is rejected.
- Login JSON `role` and `tenantId` do not select the actor.
- `X-Role: manager` and `X-Tenant-Id: tenant_harbor` do not change a Summit analyst cookie, and they do not authenticate without a cookie.
- Avery Chen cannot read `inv_harbor_1800` or `inv_summit_9600`.
- Manager cannot open the analyst or auditor list views. Auditor cannot open oversight. Auditor cannot read the Summit invoice.
- Approve and pay are forbidden for analyst, manager, auditor, and the other tenant.
- Demo error and slow states stay off unless `EARS_ALLOW_DEMO_FAULTS=1`.
- `app/`, `lib/`, and `components/` do not contain `stripe`, `plaid`, `swift`, `routing number`, or `account number`.

Browser and HTTP (`e2e/j001-slice.spec.ts`), all passed:

- Unauthenticated `GET /api/invoices/inv_harbor_50000` with manager and Harbor headers returns 401.
- Avery login body that also sends `role: manager` and `tenantId: tenant_summit` still returns analyst and `tenant_harbor`.
- That session receives 403 for `inv_harbor_1800` even with spoofed headers. `GET /api/session` still reports analyst and Harbor.
- Sam Ortiz receives 403 for `inv_harbor_50000` and lists only `INV-SMT-2026-0007`.
- Sam's browser opening `/invoices/inv_harbor_50000` shows Access denied and does not render `$50,000.00`.
- Authenticated approve and pay return 403 `operation_forbidden`.
- Cookie `tampered.token` returns 401.
- Manager opening `/invoices` sees Access denied. Auditor detail has no Approve or Pay button.
- Riley Quinn sees the empty state.

## Limitations
- Demo identity selection is not SSO. Anyone who can open the app can choose a seeded employee. The threat model already states this.
- Records are in memory. Restarting the process reloads the same fixtures. Nothing is mutated.
- Policy text is metadata. Retrieval, mock ERP, and citations are EARS-002.
- Approval state, separation of duties, and the audit viewer are EARS-003. The refuse routes are not that state machine.
- `npm audit` reports transitive advisories. They were not patched in this order.
- CI on GitHub has not been observed yet. Local commands above are the evidence.
- This builder did not review its own diff as the independent reviewer and did not merge or deploy.

## Not done
EARS-002 was not started. No deploy. No merge. No Controller ACCEPT.
