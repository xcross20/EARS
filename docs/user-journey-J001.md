# J001 — Vendor invoice review and approval
## Personas
Analyst: can view assigned invoices and submit recommendations, cannot approve own request.
Manager: can inspect permitted pending requests and approve/reject with reason.
Auditor: read-only access to permitted audit events and supporting evidence.

## Happy path
1. Analyst enters a labeled demo session and opens synthetic $50,000 invoice.
2. Analyst requests review; system retrieves only authorized policy passages and vendor data through mock ERP.
3. AI drafts recommendation with cited sources; deterministic rules validate thresholds and discrepancies.
4. Analyst checks and submits request; immutable-in-intent audit event records action.
5. Manager sees pending request, approves or rejects with rationale.
6. Auditor views chronological decision trace and source references.

## Negative paths
Cross-tenant access denied; unauthorized policy not retrieved; analyst cannot approve; replayed approval cannot double-commit; missing citation causes abstention/manual review; unavailable ERP yields explicit failure rather than invented data.

## First slice
EARS-001 implements step 1 and invoice detail only. EARS-002 adds review; EARS-003 completes approval and audit.
