# Initial threat model
Assets: tenant invoices, policy documents, vendor records, approval decisions, audit events, model/tool credentials.
Adversaries: cross-tenant user, overprivileged analyst, malicious invoice text, replayed tool request, compromised browser session.

## Mandatory mitigations
Server-side tenant and RBAC checks before retrieval; tool allowlists and parameter validation; prompt-injection resistant separation of document text from instructions; approval policy outside LLM; idempotent state changes; no raw secrets in logs; structured audit events; denial tests.

## Open risks
Demo role switching is not enterprise SSO. Local audit logs are not tamper-proof. LLM output may hallucinate. Do not claim enterprise readiness until separately assessed.
