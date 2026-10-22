# Architecture decision record — initial
## Components
Browser app, backend API, persistent store, deterministic authorization/policy checks, retrieval adapter, mock ERP, model adapter, workflow state machine and audit log.

## Trust boundaries
Browser is untrusted. Backend establishes demo session identity; all invoice/document/tool reads check tenant and role before data enters model context. Tool credentials stay server-side. Model output is untrusted and cannot approve payments or override policy.

## Suggested implementation
Next.js TypeScript web app, FastAPI backend, PostgreSQL (SQLite allowed for isolated local tests if semantics are covered), typed contracts, seeded fixtures. Use explicit idempotency keys for state changes. Keep model provider optional and test via fixtures.

## Decision pending
Choose smallest deployable architecture during EARS-001, record tradeoffs and verification evidence; do not implement K8s or real SSO by default.
