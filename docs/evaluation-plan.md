# Evaluation plan
## Golden cases
Seed cases: valid invoice, invalid vendor, threshold exceeded, duplicate invoice, missing policy, malicious instruction embedded in invoice, cross-tenant invoice, unauthorized manager action, stale approval, ERP outage.

## Metrics
Task completion; citation precision; authorization violations (target zero); approval bypasses (target zero); tool-call validity; latency p50/p95; per-case model cost; human correction rate.

## Method
Use deterministic fixture cases for CI, independently reviewed golden labels, and shadow-mode model evals. Separate end-result quality from trajectory compliance. A model judge never substitutes for deterministic authorization tests.
