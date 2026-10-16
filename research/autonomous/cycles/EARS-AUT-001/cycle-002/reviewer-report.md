# EARS-003 cycle 002 independent review

Reviewed SHA: `02392bea6d73a49aacc10cdcd25420ca1ca27fd3`
Worktree: `/tmp/ears-003-r02`
Parent: `1c84e36f768b7723f990911fdbd4b91cdd20a46b`
`git status --porcelain` was empty before the review commands and after this report was written.
This report is not a controller decision.

The commit message says it persists approval and session state across process restarts. The diff adds `lib/state-file.ts` and calls it from `lib/cases.ts` and `lib/session.ts`. Workflow cases, audit events, idempotency records, and the session revocation map are written under `EARS_STATE_DIR`. I read `work_orders/EARS-003.md` and `NEXT.md` as specifications only. They ask for a durable approval state machine and for revoked sessions before approval writes. They are not evidence that this commit does those things.

## Commands

| Command | Exit |
| --- | ---: |
| `npm ci` | 0 |
| `npm run typecheck` | 0 |
| `npm test` | 0 |
| `npx playwright install chromium` | 0 |
| `npm run test:e2e` | 0 |
| `npm run build` | 0 |
| `npm audit --audit-level=critical` | 1 |

`npm test` passed 21 tests. `npm run test:e2e` passed 6 tests. The audit exit is a recorded failure. `npm audit --json` contained only `GHSA-5gmw-xhrv-c9v3`, `GHSA-6g55-p6wh-862q`, `GHSA-82fw-gwwq-j7x9`, `GHSA-85c8-ppgw-ccpr`, `GHSA-fxqj-rqcc-2cmp`, `GHSA-qx2v-qp2m-jg93`, and `GHSA-r28c-9q8g-f849`. `newCriticalAdvisory` is false. Dependencies were not upgraded.

## Restart

`EARS_STATE_DIR` was wiped, then set to `/tmp/ears-aut-001-out/cycle-002/state`. The server was `next start` on `127.0.0.1:3466` with an empty `XAI_API_KEY`. Process ids were 85055, then 85107, then 85154. Each process was stopped and the port stopped accepting connections before the next start. `restartTested` is true.

Before the first stop, Harbor auditor `emp_quinn_adler` read:

- `evt_ouNQFXqjpKmG`, action `submit`, invoice `inv_harbor_50000`, rationale null, outcome `refer_to_manager`, actor `emp_avery_chen`
- `evt_FashF8WZbzNQ`, action `approve`, rationale `Threshold exception reviewed. No payment.`, outcome `manager_approved`, actor `emp_morgan_hale`

The case was `manager_approved`, version 2, `paymentExecuted` false. A Summit submit, `evt_bNZCwrCAc_DB`, was on disk and was not returned to the Harbor auditor.

After process 85107 started, a new auditor login returned the same two Harbor event ids, actions, and the same approval rationale. The analyst and manager cookies minted by process 85055 still authenticated. The analyst cookie was then revoked. Submit, decision, and `GET /api/audit` with that cookie returned 401. `sessions.json` stored `revoked: true` for that session.

After process 85154 started with the same directory and secret, that revoked cookie still received 401 for submit, decision, and `GET /api/audit`. The unrevoked manager cookie still authenticated. A new auditor login still returned `evt_ouNQFXqjpKmG` and `evt_FashF8WZbzNQ` with the original rationale. A later conflicting rejection returned 409 `illegal_transition`. Neither state file contained the session secret. `survivesRestart` is true.

## Concurrency

In one other `next start` process, pid 87475 on port 3467, with a fresh state directory, analyst submit of `inv_harbor_50000` returned version 1. `Promise.all` then sent approve and reject at that same `expectedVersion`. Approve returned 200 with rationale `concurrent approve`. Reject returned 409 `illegal_transition`. The case stayed `manager_approved` with that rationale. The audit log had one submit, `evt_5CyCyVuj1JIr`, and one approve, `evt_rlDtWHJb3r5P`. No reject event was stored. `concurrentDecisionsSingleTerminal` is true. This is single-process only.

## Other observed checks

Copied cookies were rejected after logout, including after the invoice route had already authenticated the session. Revoked sessions could not submit, decide, or read the audit log. Login JSON role and tenant, and `X-Role` / `X-Tenant-Id`, did not change the server actor. Cross-tenant invoice read and decision were 403, and the Summit invoice page did not contain Pine Ridge, the Summit policy id, or the Summit invoice number. Riley Quinn, an unassigned Harbor analyst, could not submit Avery's invoice.

The no-key review of the seeded malicious description stayed `refer_to_manager`, `isAuthorization` false, and did not cite the Summit policy. A scripted draft that cited an unauthorized id abstained with an empty citation list and did not authorize payment. A missing vendor id abstained, did not call the model, and did not invent a vendor status. Non-array citation fields abstained. A thrown or null provider draft was `provider_fallback`; the empty-key path was `mode: "deterministic"`. `lib/review/xai.ts` imports `server-only`, and `api.x.ai` was not present in `.next/static`. A mock fetch to the adapter aborted at 8002 ms with `XAI_TIMEOUT_MS` 8000. No live xAI call was made.

Payment and legacy `/approve` stayed 403, and the approved decision still had `paymentExecuted` false. Audit POST, PUT, and DELETE returned 405. Changing the returned audit object locally did not change the next read, and a forged cross-tenant audit body did not enter the store. The auditor could not submit or decide. The analyst could not decide. After a stopped process, the persisted submitter was changed to the manager and a new process was started; that manager's approval returned 403 `operation_forbidden` and the only audit action remained `submit`. A second submit of the Harbor invoice was an idempotent replay and did not add a second submit event. A repeated approval kept `Threshold exception reviewed. No payment.` A conflicting rejection and a stale expected version both returned 409.

## Residuals that are not findings

`writeStateFile` is an atomic rename for one JSON document, but `saveCase`, `appendAuditEvent`, and idempotency are separate writes. A crash between them was not observed. Two processes are not serialized: the in-memory `workflowLoaded` and `sessionsLoaded` flags do not reload another process's writes, and there is no cross-process lock. The concurrency result above is single-process only. State files were mode 0644 and contain session ids and audit events, not the signing secret. Local audit files are already described as not tamper-proof in `docs/threat-model.md`. These are residuals, not a material gap in the restart behavior that was tested.

## Finding

`R02-01` is P2, disposition `documented_preexisting_risk`. The critical audit failure is the previously approved advisory set. It is not recorded as a passing audit.

## Verdict

`reviewerRecommendation`: `NO_MATERIAL_DEFECTS`

This report is not a controller decision.
