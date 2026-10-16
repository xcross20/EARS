# Strategy v0.1
**Status:** hypothesis, revisable by evidence; mission invariants are not revisable by autonomous agents.

## Wedge
One synthetic vendor-invoice review and approval journey for a fictional financial-services company. Optimize for a complete, usable vertical slice, not breadth of infrastructure.

## Sequence
1. EARS-001: contracts, architecture, seeded demo and application shell.
2. EARS-002: role-filtered policy retrieval, mock ERP, cited recommendation.
3. EARS-003: durable approval states, manager queue, audit viewer, full journey tests.
4. EARS-004: hardened auth/SSO reference, threat-model validation, observability and eval expansion.

## Technology defaults (subject to design review)
Next.js + TypeScript web UI; Python FastAPI service; PostgreSQL persistence; mock ERP HTTP adapter; deterministic policy engine; provider-neutral LLM interface with deterministic fixture fallback. Prefer a single deployable app for initial slice if that reduces complexity. No K8s, real bank integrations or live payments in MVP.

## Rethink triggers
Repeated blocked work orders, contradictory customer evidence, material security failure, unacceptable complexity, poor evaluation outcomes, or a clearly simpler approach. Record alternatives, tradeoffs, recommendation and approval. Never silently expand scope.
