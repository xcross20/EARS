# EARS-AUT-001 cycle 002

Controller decision: **ACCEPT** for the EARS-003 engineering scope. This does not merge, deploy, or certify the autonomy harness as a general controller.

## Binding

- Candidate and reviewed SHA: `02392bea6d73a49aacc10cdcd25420ca1ca27fd3`
- Repair parent: `1c84e36f768b7723f990911fdbd4b91cdd20a46b`
- Reviewer session: `01a14644-5e16-7df0-902a-37f8b689abbd`
- Builder session: `01a1452e-fba4-7b12-b473-50b9d5a66c7f`
- Review worktree: `/tmp/ears-003-r02` (detached, clean, HEAD unchanged)
- Builder worktree: `/tmp/ears-003-repair`

The reviewer session is not the builder session. Check records all carry the reviewed SHA. Mandatory commands exited 0 except `npm audit --audit-level=critical`, which exited 1. The advisory set is the previously approved seven GHSA ids. `newCriticalAdvisory` is false. Exit 1 is a recorded failure with disposition `documented_preexisting_risk` (finding `R02-01`, P2). No P0 or P1 finding is open.

## What the gate required

`evaluateEvidence` returned `ACCEPT` only after the reviewed SHA matched, independence and isolation held, required checks existed, security booleans were true, concurrency was not null, restart was tested, the store survived restart, and the P2 finding had a disposition. The reviewer recommendation `NO_MATERIAL_DEFECTS` was not treated as the acceptance evidence.

## Controller corroboration

The controller repeated `npm audit --audit-level=critical` in `/tmp/ears-003-r02`. Exit code 1. The same seven advisory ids. Metadata: 2 critical, 1 high, 2 moderate.

The controller also ran a separate `next start` against a fresh `EARS_STATE_DIR`, with an empty `XAI_API_KEY`. Avery submitted `inv_harbor_50000`. Morgan approved it with rationale `Controller restart check. No payment.` Quinn's audit contained `evt_FbQ-5ZzchOHa` (submit) and `evt_9xutvccCeMJz` (approve, that rationale). `paymentExecuted` was false. After that process was stopped, a new process with the same directory returned those same event ids and the same rationale to a new auditor login. The analyst and manager cookies from the first process still authenticated. Logout revoked the analyst cookie. A third process still returned 401 for that cookie on session, submit, decision, and `GET /api/audit`, and the audit events were still present. `POST /api/payments` returned 403. The state files did not contain the session secret.

## Residuals kept in view

Single-process `Promise.all` committed one terminal outcome. There is no cross-process lock. A crash between the separate case, audit, and idempotency writes was not observed. Local state files are not a tamper-proof audit log. Demo secrets `e2e-demo-session-secret` and `ci-demo-session-secret` are still outside `REJECTED_SECRETS`. Live xAI was not called. Demo auth is not production SSO.

## Next authorized action

Commit `DECISION.md`, `STATE.md`, and `NEXT.md` on a control branch whose parent is the reviewed SHA. `NEXT.md` status is `J001_COMPLETE — AWAITING_NEXT_APPROVED_MISSION`. Do not open another product work order.
