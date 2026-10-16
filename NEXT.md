# Next work order
**ID:** EARS-002
**Status:** QUEUED — ELIGIBLE FOR BUILDER AFTER OPERATOR KICKOFF (not started)
**Prerequisite:** EARS-001 engineering ACCEPT recorded in `DECISION.md` on `control/ears-001-accept`.
**Base:** accepted EARS-001 implementation `00eba687ce015d001dec0d3f3aa4d2b2874d6db2`, plus approved controller bookkeeping. Do not assume branches or PRs are merged.
**Full specification:** `work_orders/EARS-002.md`.

## Objective
Deliver an authorized, evidence-grounded synthetic invoice review using procurement policies and a mock ERP, with deterministic checks, traceable citations and explicit abstention when evidence is missing.

## Mandatory first slice
1. Fix the R01-01 authorization footgun: `invoicesForView` must enforce the actor's allowed view at the data-access boundary; add direct helper and HTTP regression tests.
2. Address R01-02: introduce actor-scoped data access for policies, vendors and ERP results. Raw seed exports must not be available as a shortcut to model or tool context.
3. Verify that cross-tenant documents never enter retrieval results or model context, including negative and injection tests.
4. Retain all EARS-001 authz and E2E tests. No real financial operations.

## Boundaries
- Human operator initiates EARS-002; no auto-execution, merge or deployment.
- EARS-002 may not claim a passing npm security audit. Track documented advisories and reassess any changed dependencies.
- No production SSO, live ERP, payment execution or external data.
- Independent Reviewer and Controller acceptance required before EARS-003.

## Evidence
Commit SHA, exact commands/exit codes, test outputs, authorization and citation evaluations, independent reviewer report and Controller decision.
