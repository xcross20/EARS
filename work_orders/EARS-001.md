# EARS-001 — First browser journey

**Status:** READY_FOR_BUILDER. **Owner:** Grok CLI Builder. **Prerequisite:** Foundation branch reviewed/available. **Stop after this order.**

## Outcome
From a clean checkout, a developer starts the application with documented commands. An Analyst using an explicitly simulated identity opens a seeded fictional $50,000 invoice in the browser. Manager and Auditor see role-appropriate navigation. Server-side authorization denies cross-tenant reads and unauthorized operations.

## Scope
1. Inspect existing repository; record an ADR choosing the simplest maintainable app architecture. Use Next.js/TypeScript and a Python API only if the second runtime has demonstrated value; a well-structured Next.js full-stack application is acceptable.
2. Build an accessible responsive shell and invoice list/detail screens, with loading, empty, error and denied states.
3. Implement server-issued demo identity/session, clearly labeled **DEMO — NOT PRODUCTION AUTH**. Never authorize based on client-supplied role or tenant headers alone.
4. Seed fictional tenants, employees, vendors, procurement policy metadata and at least one $50,000 invoice. Do not use real financial records.
5. Enforce tenant and role authorization in server handlers and data-access boundaries; include positive and negative tests.
6. Provide deterministic seed/start/test scripts, `.env.example`, CI workflow and README updates. No secrets in source.
7. Write builder handoff evidence. Do not self-accept.

## Acceptance tests
- Clean install and local start documented and reproducible.
- Analyst can navigate list → invoice detail through browser.
- Manager and Auditor have distinct permitted views.
- Cross-tenant direct URL/API reads denied.
- Client role/tenant spoofing does not grant access.
- Automated tests and CI commands pass; at least one browser E2E covers analyst flow.
- Reviewer can inspect concrete test output and verify no live payment path exists.

## Out of scope
Real SSO/OIDC, real ERP, live LLM, RAG, approvals, payment execution, public deployment, infrastructure-as-code and generalized MCP framework.

## Stop / escalation
Stop if foundation invariants conflict, authorization cannot be enforced, or work requires live credentials or deployment. Record BLOCKED evidence instead of bypassing controls. Do not begin EARS-002.
