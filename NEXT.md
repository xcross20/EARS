# Next work order
**ID:** EARS-001
**Status:** READY_FOR_BUILDER (not executed)
**Branch:** feat/ears-001-foundation (or a fresh child implementation branch)

## Objective
Deliver the first browser-visible vertical slice: a seeded synthetic invoice, role-aware navigation and invoice detail screen, plus repeatable local startup and test commands.

## Scope
- Document app architecture and explicit trust boundaries before implementation.
- Implement app shell with Analyst / Manager / Auditor demo identity selector, visibly labeled **simulation only**.
- Seed one fictional $50,000 invoice, vendor and procurement policy fixture.
- Implement server-side authorization checks for invoice reads; never trust client role alone (signed demo session or server-issued session).
- Analyst sees permitted invoice and its status; manager/auditor have distinct navigation.
- Provide automated positive and negative tests and CI.

## Exclusions
No real SSO, real payments, public deployment, full RAG, real ERP, or production claims. No unauthenticated role spoofing via client-supplied headers.

## Acceptance
1. Documented local startup works.
2. Browser renders seeded invoice.
3. Unauthorized tenant/role invoice access is denied server-side.
4. Tests run noninteractively in CI.
5. Reviewer independently verifies behavior; Controller records evidence.

## Follow-on
EARS-002: grounded review and mock ERP. EARS-003: approval state machine and audit trail.
