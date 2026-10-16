# Next work order
**ID:** EARS-003
**Status:** QUEUED — NOT STARTED; HUMAN OPERATOR KICKOFF REQUIRED
**Prerequisite:** EARS-002 engineering ACCEPT recorded on `control/ears-002-accept`.
**Base:** accepted EARS-002 SHA `d716b97848cc78c671dda40c729fe1f41cdab4be` plus Controller bookkeeping; do not assume PRs merged.
**Full specification:** `work_orders/EARS-003.md`.

## Objective
Complete J001 with analyst submission, manager approval/rejection, role separation, immutable-ish chronological audit events, and an Auditor evidence viewer. All data synthetic. No payment execution.

## Mandatory security preflight — BEFORE enabling approval writes
1. Implement server-side session revocation so logged-out or invalidated tokens cannot approve; test replay of copied cookie.
2. Validate invoice foreign-key relationships and tenant consistency at the data boundary before rendering or review/model packet construction; never leak cross-tenant vendor/policy metadata.
3. Make missing vendor and malformed citation inputs fail closed without unhandled exceptions; add regression tests.
4. Add bounded timeout and explicit server-only boundary to xAI adapter; distinguish no-key deterministic mode from provider-failure fallback in UI and API.
5. Maintain explicit risk ledger for failed `npm audit` and avoid unreviewed forced major upgrades.

## Workflow requirements
- Analyst may submit only assigned invoice after evidence-grounded review, subject to deterministic policy rules.
- Manager may approve/reject with rationale only within authorized tenant and without self-approval.
- Auditor may view immutable-ish chronological audit records but cannot mutate.
- Enforce state transitions, idempotency and concurrency checks server-side.
- Every decision links authorized evidence and records actor, action, timestamp, outcome and rationale.
- Negative tests: cross-tenant, role escalation, replay, injection, double-submit, unauthorized approval, stale state, and audit tampering.
- No real payment, live ERP, production SSO, deployment or merge.

## Stop conditions
Do not begin EARS-003 automatically. Builder stops for independent review and Controller decision before any subsequent work order.
