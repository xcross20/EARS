# EARS-003 builder report

**Role:** Builder. This report does not accept the work order.
**Branch:** `feat/ears-003`
**Base:** `origin/control/ears-002-accept` at `d76a34e2fe71475fafb3dd981e14e24c1b671609`
**Implementation commit:** `3ef495e2db19f9975dd043f2f38b618157dbc7d8`
`NEXT.md`, `STATE.md`, and `DECISION.md` were not changed.

## What changed
- Sessions now carry a server-side id. Logout through `DELETE /api/session` and **End demo session** revokes that id. A copied cookie no longer authenticates.
- `readInvoiceForActor` checks vendor, policy, and assignee tenant. A cross-tenant foreign key is not returned, and its id is replaced with `redacted` on the visible invoice. A missing vendor does not throw. The review abstains and does not invent a status.
- A model draft whose `citationIds` is missing or not a string list abstains. A thrown or empty provider draft falls back to the deterministic checks and is labeled `provider_fallback`, which is distinct from `mode: "deterministic"` when no key is configured.
- The xAI adapter imports `server-only`, sends `AbortSignal.timeout` of 8 seconds, and still reads the key only from `XAI_API_KEY`. No live xAI call was made.
- An analyst can submit only an assigned invoice after a grounded review (`refer_to_manager` or `no_exception_noted`). Abstain and duplicate-hold cannot be submitted. The server recomputes the review. It does not trust a client-supplied recommendation.
- A manager in the same tenant can approve or reject a pending submission with a rationale, once. The submitter cannot decide it. A repeated decision does not append another audit event or change the stored rationale. A conflicting second outcome is `illegal_transition`. A wrong `expectedVersion` on a still-pending request is `stale_state`.
- The auditor evidence page lists append-only events for that tenant. `POST`, `PUT`, and `DELETE /api/audit` return 405. Returned events are copies.
- `POST /api/payments` and `POST /api/invoices/:id/approve` still return 403. A manager decision sets `paymentExecuted` to false. `isAuthorization` on the stored review stays false.
- `server-only@0.0.1` was added so the adapter and the session/workflow stores have an explicit server boundary. Vitest aliases that package to an empty stub. Next and Vitest were not upgraded.

## Commands and exit codes
Working directory: `/Users/immanuellewis/worktrees/EARS`. Node `v22.22.0`. npm `10.9.4`. Date: 2026-10-16. These runs are after the final browser-test cookie wait.

| Command | Exit | Result |
| --- | --- | --- |
| `npm run typecheck` | 0 | `tsc --noEmit` |
| `npm test` | 0 | Vitest 3.2.7. 4 files, 21 tests passed (`session` 6, `workflow` 2, `review` 7, `authz` 6). |
| `npm run test:e2e` | 0 | Playwright. 6 tests passed in 13.2s. Warning: `NO_COLOR` ignored because `FORCE_COLOR` is set. |
| `npm run build` | 0 | Next.js 15.5.28 compiled successfully. New dynamic routes: `/api/audit`, `/api/invoices/[invoiceId]/submit`, `/api/invoices/[invoiceId]/decision`. |
| `npm audit --audit-level=critical` | 1 | 5 vulnerabilities: 2 moderate, 1 high, 2 critical. `npm audit fix` was not run. This is not a passing audit. |

Adding `server-only` did not change that advisory set. `npm audit fix --force` would still move Next to 16.4.2 and Vitest to 5.0.5. That was not done.

## Negative checks
- Revoked session token reads as null, including when the request also sends manager and Harbor headers.
- Avery's detail for a retargeted Summit policy has `policy: null`, `relation: "cross_tenant"`, and does not contain `policy_summit_procurement` or `10000 USD`. The scripted model is not called.
- A missing vendor abstains. The review body does not contain Lantern or an invented active status. The model is not called.
- A non-array `citationIds` abstains. A thrown xAI draft uses `provider_fallback` and still refers the $50,000 invoice to a manager.
- The xAI mock `fetch` receives an `AbortSignal`. The adapter source contains `import "server-only"` and no embedded key.
- Jordan cannot submit the duplicate or the Lantern outage. Sam cannot submit or decide the Harbor invoice. The refusal body does not contain Cedar or `5000000`. Quinn's audit list does not contain Sam's Summit invoice.
- Avery and Quinn cannot decide. Morgan cannot decide a submission retargeted onto Morgan's own employee id. A second approval does not replace the rationale, including a rationale that says to pay the invoice.
- The browser journey logs Avery out, replays the copied cookie, and gets 401 with no Cedar in the body. Avery then submits. A second submit is `idempotentReplay`. Avery's decision call is 403. Morgan records one approval. `POST /api/payments` stays 403. Quinn sees the rationale and the Harbor policy citation, not the Summit policy title. `POST /api/audit` is 405.

## Limitations
- The session registry, workflow cases, and audit log are process memory. A restart clears them. That matches the synthetic seed. It is not a durable production store.
- Logout revokes the presented session id. It does not rotate the signing secret or revoke every other browser for that employee.
- Live xAI latency, error bodies, and model compliance were not tested. CI and Playwright set `XAI_API_KEY` to empty. The timeout is verified only by the mock `fetch` receiving a signal.
- `ci-demo-session-secret` and `e2e-demo-session-secret` are still not in `REJECTED_SECRETS`.
- Demo identity selection is still not production SSO. No payment integration was added.
- PostCSS via Next 15.5.28 and Tinypool via Vitest 3.2.7 remain `ACCEPT_WITH_DOCUMENTED_RISK` for this demo. The audit exit 1 is not a pass.

## Not done
No self-review, no ACCEPT, no merge, no deploy, and no work order after EARS-003.
