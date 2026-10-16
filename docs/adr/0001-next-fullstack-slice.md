# ADR 0001 — One Next.js app for the EARS-001 slice

## Status
Accepted for EARS-001 implementation. Pending independent review. This does not accept the work order.

## Context
EARS-001 needs a browser invoice list and detail, a simulated identity, server-enforced tenant and role checks, synthetic seed data, and repeatable tests. The strategy allows Next.js plus FastAPI and PostgreSQL, and it also allows a single deployable app when that is simpler. This slice has no writes, no ERP calls, and no model calls.

## Decision
Ship one Next.js TypeScript application.

- Pages and route handlers live in the same process.
- Demo identity is an httpOnly HMAC-signed cookie. The payload stores `employeeId` and expiry. Role and tenant are loaded from the server seed.
- Login requests may include `role` or `tenantId`. Those fields are ignored. `X-Role` and `X-Tenant-Id` are ignored.
- Invoice, vendor, employee, and policy records are a typed in-memory seed. There is no database in this slice.
- Approval and payment routes exist only to refuse the operation. They do not call a bank, card network, or ledger.

## Tradeoffs
A second Python service would separate the trust boundary more explicitly, at the cost of two runtimes before any cross-process behavior exists. PostgreSQL would make later approval state easier, and it is unnecessary while every record is a fixture and nothing is mutated. The signed cookie is not enterprise SSO. The threat model already records that limit.

## Verification
Unit tests cover the seed, the authorization matrix, header spoofing, and the absence of a payment integration. Browser tests cover the analyst path, distinct manager and auditor views, empty and denied states, and API denial. Commands and results belong in `research/autonomous/EARS-001-builder-report.md`.
