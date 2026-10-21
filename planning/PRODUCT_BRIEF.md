# EARS — Product Brief

**Document:** `PRODUCT_BRIEF.md`  
**Phase:** 1 — User Outcome  
**Version:** 1.0 — Final proposed product baseline  
**Date:** 2026-10-21  
**Product:** EARS — Enterprise AI Reference System  
**Customer-facing description:** AI-assisted invoice exception review and approval  
**Project type:** Forward Deployed Engineer (FDE) portfolio reference implementation  
**Customer:** Northbridge Asset Management (*fictional*)  
**Status:** Product definition complete; implementation and measured outcomes not yet accepted  
**Next phase:** `REFERENCE_EXPERIENCE.md`

> **Truth-in-demonstration statement.** EARS is a synthetic customer engagement and portfolio project. Northbridge Asset Management, its people, invoices, policies, process metrics, and systems are fictional. Any quantitative goals below are proposed acceptance thresholds, **not observed results**. No real payments, real customer adoption, regulatory certification, or production enterprise deployment are claimed.

---

## 1. Executive product decision

EARS will demonstrate how a Forward Deployed Engineer converts a concrete enterprise operational problem into a working, secure, explainable AI-assisted application. It is **not** a generic AI platform, research-experiment manager, autonomous development system, or complete accounts-payable replacement.

**Single use case:** exception review of USD-denominated, purchase-order-backed professional-services invoices with milestone acceptance evidence.

**Single primary journey:** an AP analyst opens an exception, inspects synchronized source records and supporting documents, reviews deterministic control findings and an AI-generated evidence assessment, submits a recommendation, and an authorized manager approves, rejects, or returns the case. An auditor can reconstruct the decision from durable, attributable evidence.

**Value proposition:** reduce manual evidence assembly and review effort while preserving or improving decision correctness, policy compliance, and audit reconstruction.

**Portfolio thesis:** a credible FDE delivers a narrow customer outcome end to end, including integration contracts, model boundaries, product usability, security, operational failure handling, and measured results.

### 1.1 Decision hierarchy

When trade-offs arise, prioritize:

1. Safety and authorization of business decisions.
2. A complete, understandable user journey.
3. Correctness and evidence provenance.
4. Demonstrable improvement in review efficiency.
5. Simplicity of implementation and operations.
6. Additional features or technical sophistication.

A feature is not justified merely because it showcases a technology.

---

## 2. Customer situation and problem framing

### 2.1 Fictional customer

**Northbridge Asset Management** is a fictional financial-services organization with an accounts-payable operations team reviewing invoices for professional-services engagements. The organization uses an ERP for invoices and purchase orders, a vendor master source for vendor status, and a document repository for acceptance memos and internal policies.

These systems are represented by **synthetic data and realistic service contracts**, not by live SAP, Oracle, NetSuite, or financial infrastructure.

### 2.2 Business problem

An invoice exception requires an analyst to reconcile structured records with unstructured milestone evidence. The analyst must find the relevant purchase order, determine vendor eligibility, read the milestone acceptance memo, compare values and requirements, prepare a defensible recommendation, and pass the case to a manager with enough context to decide. An auditor may later need to reconstruct why the decision occurred.

The costly work is **assembling, reconciling, and communicating evidence**—not merely extracting invoice fields.

### 2.3 Discovery hypotheses, not customer findings

| ID | Hypothesis | How EARS will test it |
|---|---|---|
| H-01 | Evidence gathering is a meaningful contributor to review time | Measure active time spent locating and reading evidence in a manual baseline |
| H-02 | Repeated cross-system reconciliation adds avoidable work | Compare repeated review tasks with and without an integrated workspace |
| H-03 | Inconsistent analyst summaries slow managerial decisions | Assess completeness and usability of submitted review packets |
| H-04 | Decision reconstruction is difficult when rationale and sources are fragmented | Run timed audit reconstruction tasks on synthetic cases |
| H-05 | Grounded AI synthesis can accelerate understanding of milestone evidence | Compare active review time and correctness across matched cases |

The product may be worth demonstrating even if one or more hypotheses are not supported. Negative findings must be reported.

### 2.4 Current-state journey (assumed)

1. Analyst finds an exception in the ERP queue.
2. Analyst separately retrieves the invoice, PO, and vendor record.
3. Analyst searches for the milestone memo and applicable policy.
4. Analyst compares structured records and reads narrative evidence.
5. Analyst writes a recommendation, including outstanding questions.
6. Manager requests clarification or records a decision.
7. Auditor later assembles records from multiple locations.

**Known limitation:** this journey is a designed fictional baseline, not an observed workflow at a real client.

---

## 3. Intended users, jobs, and authority

| Persona | Job to be done | Decisions / actions | Must not do |
|---|---|---|---|
| **AP analyst** | Understand an exception and produce an evidence-backed recommendation efficiently | Inspect assigned cases; run/review assessment; submit recommendation; correct or request missing evidence | Final-approve a case; bypass controls; access other tenants |
| **Approving manager** | Make a justified, authorized decision without redoing all analyst work | Inspect original records, sources, rule results and analyst recommendation; approve, reject, or return with rationale | Self-approve; approve blocked/stale cases; execute payment |
| **Internal auditor** | Reconstruct what happened and determine whether required controls were followed | Search and read authorized historical cases, evidence versions, actors, timestamps, rules and rationale | Change cases, source records, or decisions |
| **Integration owner** | Diagnose source availability, contracts, and data freshness | Inspect technical integration status and correlation IDs in controlled diagnostic tooling | Modify business decisions through integration diagnostics |
| **Operations sponsor** | Evaluate whether the delivered workflow is useful | Review demonstration, acceptance evidence, task success and efficiency measures | Treat a synthetic pilot as proven organizational ROI |

### 3.1 Authority invariants

- Only the backend establishes identity and permissions; client-visible role labels confer no authority.
- Tenant and object authorization precede retrieval, model context construction, and business mutations.
- AI output is **advice**, not authorization, policy, or a payment instruction.
- Deterministic mandatory rules cannot be overridden by model text.
- A manager cannot approve their own submission.
- Every final decision requires an authorized human actor and recorded rationale.
- EARS never executes or initiates a real payment.

---

## 4. Product scope

### 4.1 In scope for the portfolio release

| Dimension | Approved scope |
|---|---|
| Customer | One fictional asset-management firm as the visible demo tenant; a second seeded tenant solely to prove isolation |
| Invoice class | Purchase-order-backed professional-services milestone invoices, USD only |
| Data sources | Mock ERP HTTP API, vendor master adapter, text document repository, versioned synthetic policy data |
| Document formats | Prepared text or text-extractable synthetic invoice, PO, milestone memo, and policy content |
| AI | One structured, citation-grounded evidence assessment, with uncertainty and abstention |
| Rules | A small explicit set of versioned deterministic business controls |
| Workflow | Analyst review → manager approve/reject/return → auditor history |
| Security | Authenticated demo identities, role/tenant/object authorization, secure server-side integrations |
| Persistence | Durable relational state, atomic decision transitions, replay protection, audit evidence |
| Operations | Health checks, structured logs, correlation IDs, dependency errors, model latency/cost visibility |
| Evaluation | Six canonical demonstrations, security and concurrency suites, labeled AI cases, usability/outcome exercise |
| Delivery | Reproducible hosted synthetic demo, documentation, acceptance and release evidence |

### 4.2 Explicit non-goals

- Real payment execution, banking connectivity, or posting approvals to a live ERP.
- Fraud detection, sanctions screening, tax accounting, foreign exchange, or general ledger replacement.
- Arbitrary document OCR, handwriting, or broad document intelligence.
- Configurable workflow designer or general-purpose policy engine.
- Multi-agent autonomous approvals or self-directed coding infrastructure.
- Live SAP/Oracle/NetSuite integrations or enterprise SSO certification.
- Self-service tenant onboarding or organization administration.
- Multi-region, high-availability infrastructure or a custom observability platform.
- Claims of regulatory certification, production readiness, real client adoption, or actual financial savings.

### 4.3 Existing repository disposition

Prior EARS work established an initial invoice review → submission → manager decision → audit demonstration. **Restarting product definition does not authorize deleting or rewriting that implementation.** The existing code is a candidate asset to evaluate against this brief in the next engineering planning stage. Existing demo authentication, file-based persistence, and model integration must be reverified rather than treated as complete enterprise capabilities.

---

## 5. Target future-state workflow

**Precondition:** an authenticated analyst has an assigned exception and is authorized to view its tenant's sources.

1. **Open queue.** Analyst sees exception status, vendor, invoice number, amount, due date, and issue category.
2. **Load case.** EARS obtains invoice/PO data from the mock ERP, vendor status from the vendor adapter, and associated supporting evidence and policy versions. UI identifies sources and freshness.
3. **Evaluate controls.** Server-side deterministic rules produce structured `PASS`, `BLOCK`, or `NEEDS_INFORMATION` findings with rule IDs and source versions.
4. **Assess narrative evidence.** AI analyzes authorized milestone evidence, produces a structured assessment with source-linked claims, identifies uncertainty, and abstains where support is inadequate.
5. **Analyst verifies.** Analyst sees original sources beside the AI summary and control findings, may request a refresh, and submits a recommendation only when the state permits.
6. **Manager decides.** Manager sees the exact review snapshot, controls, source references, and analyst recommendation; records approve, reject, or return with rationale, subject to authority and freshness checks.
7. **Audit preserves.** EARS stores attributable events and versioned evidence references so an auditor can reconstruct the decision.

**Critical exception:** if a mandatory source is unavailable, required evidence is missing, or a material source/policy version changed after review, approval is blocked pending re-evaluation. A rejected or returned case remains inspectable.

### 5.1 AI versus deterministic responsibility

| Task | Owner |
|---|---|
| Invoice amount comparison and PO ceiling | Deterministic code |
| Vendor active/inactive status | Authoritative vendor source + deterministic code |
| Approver authority and separation of duties | Backend authorization/workflow |
| Required-document presence and freshness | Deterministic code |
| Understanding whether a memo substantively supports a milestone | AI-assisted synthesis with source citations; human verification |
| Resolving conflicting or insufficient narrative evidence | Human; AI may flag and abstain |
| Final approve/reject/return | Authorized manager |
| Payment execution | Outside EARS; prohibited |

---

## 6. Product surfaces and experience requirements

**Three primary screens** are required; do not add dashboards unless a user task demands them.

### Screen A — Exception queue

- Role-appropriate queue with searchable/sortable invoice number, vendor, amount, issue, status, and last update.
- Explicit state badges for pending review, blocked, awaiting manager, returned, approved, rejected.
- Clear empty, loading, failed-source, and permission-denied states.
- Direct navigation to the review workspace.

### Screen B — Invoice review workspace

- Structured invoice, PO, vendor, and milestone context in a coherent information hierarchy.
- Visible source, version, retrieval timestamp, and freshness status.
- Distinct panels for **deterministic controls**, **AI evidence assessment**, and **analyst action**.
- Citation interaction opens the exact source passage; unsupported or missing evidence is visually apparent.
- Manager decision section appears only when the user is authorized and the case is in the appropriate state.
- Clear differentiation between **recommended**, **submitted**, and **approved**.
- Safe refresh, retry, conflict, and stale-review flows.

### Screen C — Decision history

- Chronological case events with actor, action, timestamp, prior/new state, rationale, and linked source/policy versions.
- Read-only auditor experience with filter/search and a coherent decision narrative.
- Exportable or reproducible case evidence package, without claiming cryptographic tamper-proofing unless implemented and verified.

### Cross-cutting UX requirements

- Responsive professional desktop-first layout; keyboard-accessible interactions and labeled controls.
- Consistent typography, spacing, status vocabulary, validation, and actionable error messages.
- No placeholder critical buttons or dead-end navigation.
- Loading and failure states for ERP, document, and model dependencies.
- The user can understand what is known, unknown, blocked, and authorized without reading developer documentation.
- Public demo explicitly labels synthetic data, demo identity, and non-payment behavior.

Detailed layouts, reference comparisons, and interaction specifications belong in Phase 2 `REFERENCE_EXPERIENCE.md`.

---

## 7. Functional requirements and traceability seed

The following IDs remain stable across design, architecture, vertical slices, implementation tests, and acceptance reports.

| ID | Requirement | Priority | Acceptance evidence |
|---|---|---|---|
| **FR-01** | Display authorized invoice-exception queue with required summary fields and status | Must | Browser E2E, role-specific fixtures |
| **FR-02** | Retrieve invoice, PO, vendor, and supporting documents through explicit service adapters | Must | Contract tests, integration traces, outage tests |
| **FR-03** | Display authoritative source identifiers, versions, timestamps, and freshness | Must | Browser inspection + source-version assertions |
| **FR-04** | Execute versioned deterministic checks for all mandatory controls | Must | Rule-level positive/negative test matrix |
| **FR-05** | Produce structured AI assessment with cited factual claims, uncertainty, and next step | Must | Schema validation + labeled evaluation |
| **FR-06** | Abstain or return `NEEDS_INFORMATION` when evidence is insufficient or contradictory | Must | Missing/conflicting-evidence cases |
| **FR-07** | Permit analyst review, refresh, and submission without granting final decision authority | Must | Analyst browser E2E + API authorization tests |
| **FR-08** | Permit only authorized managers to approve/reject/return with rationale | Must | Manager browser E2E + negative access tests |
| **FR-09** | Prevent approval on blocking policy findings or stale/materially changed evidence | Must | State-transition and stale-snapshot tests |
| **FR-10** | Record exactly one final decision despite retries and concurrent requests | Must | Transactional database concurrency suite |
| **FR-11** | Preserve reconstructable, attributable decision and evidence history | Must | Auditor reconstruction exercise |
| **FR-12** | Prevent cross-tenant, cross-role, and unauthorized object/document/AI-context access | Must | Security negative suite |
| **FR-13** | Expose dependency failure and recovery states without fabricated success | Must | Fault-injection E2E/integration tests |
| **FR-14** | Provide usable empty/loading/error/blocked/conflict states for primary tasks | Must | Visual + functional acceptance |
| **FR-15** | Record structured correlation IDs and operational diagnostics without exposing secrets | Should | Log/trace assertions |
| **FR-16** | Provide reproducible synthetic demo and documented clean deployment | Must | Release candidate deployment verification |
| **FR-17** | Measure AI latency/cost and task outcome without storing unnecessary sensitive content | Should | Instrumentation and outcome report |
| **FR-18** | Support case-level evidence export or reproducible audit package | Should | Auditor package completeness check |

**Requirement change control:** if a requirement changes, update its ID's rationale, affected screens/contracts/tests, and approval record. Do not silently reinterpret a Must requirement as optional.

---

## 8. Synthetic customer business rules

These are invented project rules for the portfolio engagement, not universal accounting requirements.

| Rule ID | Mandatory control | Expected behavior |
|---|---|---|
| POL-01 | Vendor is active in authoritative vendor source | Inactive or unknown status blocks approval |
| POL-02 | Invoice references an existing applicable purchase order | Missing or invalid PO blocks approval |
| POL-03 | Invoice amount does not exceed the allowed PO/milestone limit | Over-limit amount blocks approval; fixed-precision USD arithmetic |
| POL-04 | Required milestone evidence exists and is reviewable | Missing evidence prevents final approval |
| POL-05 | Manager has authority for amount and case; no self-approval | Unauthorized decision rejected server-side |
| POL-06 | Required source records meet the defined freshness rule | Stale/unavailable material source prevents final approval |
| POL-07 | Finalized invoice cannot receive another final decision | Conflicting/repeated finalization cannot create duplicate outcome |

**Phase 3 contract decisions:** specify exact thresholds, freshness intervals, exception categories, approval authority levels, source identifiers, and rule versions in `DATA_CONTRACTS.md`. These parameters are deliberately not invented here. A policy exception must be explicitly modeled; it must never be inferred from an AI narrative.

---

## 9. Canonical demonstration scenarios

| ID | Scenario | Expected user-visible outcome | Required automated evidence |
|---|---|---|---|
| DEMO-01 | Valid professional-services milestone invoice with supporting acceptance memo | Analyst inspects cited assessment; authorized manager approves; auditor reconstructs | End-to-end workflow + source and audit assertions |
| DEMO-02 | Invoice amount exceeds allowed PO/milestone limit | Deterministic `BLOCK`; no approval possible even if AI suggests it | Rule test + forbidden transition test |
| DEMO-03 | Vendor is inactive | Approval blocked; authoritative vendor status displayed | Adapter + policy + UI tests |
| DEMO-04 | Missing or contradictory milestone evidence | AI abstains or flags uncertainty; analyst requests clarification; no unsupported final approval | Labeled AI evaluation + state test |
| DEMO-05 | ERP unavailable or material source snapshot stale | Explicit dependency/stale state; safe retry/refresh; no silent approval | Fault injection + recovery test |
| DEMO-06 | Two managers submit competing final decisions concurrently | Exactly one final outcome; second gets a conflict or idempotent replay as appropriate | Multi-connection database concurrency test |

Separate mandatory security cases include cross-tenant reads, object-level access, unauthorized mutation, analyst self-approval, prompt injection in a supporting memo, malformed model output, and source retrieval denial. Passing six demos alone does not constitute security acceptance.

---

## 10. Quality, security, and operating requirements

| ID | Requirement | Verification |
|---|---|---|
| NFR-01 | Server-side authorization on every data read, retrieval, AI context assembly, and mutation | Route-level and service-level negative tests |
| NFR-02 | Transactional case transitions with optimistic concurrency or equivalent protection | Database integration and parallel-request tests |
| NFR-03 | Atomic persistence of business transition, idempotency outcome, and audit event | Crash/failure-injection tests |
| NFR-04 | Audit records survive restart and are linked to immutable source versions or preserved snapshots | Restart + reconstruction test |
| NFR-05 | Model output is schema-validated and never interpreted as a tool instruction or permission | Malformed-output/prompt-injection tests |
| NFR-06 | Missing dependencies fail visibly and conservatively | ERP/document/model timeout tests |
| NFR-07 | Secrets and provider credentials remain server-side; public demo spend is bounded | Config review + misuse tests |
| NFR-08 | UI meets task-oriented keyboard and accessibility checks | Automated accessibility checks + manual keyboard pass |
| NFR-09 | Critical flows run in CI and in the actual release environment | CI logs + release evidence |
| NFR-10 | No real payment capability or real customer data | Architecture/code inspection + demo labeling |

**Operational measurements:** collect request and model latency (including p50/p95 where sample size permits), model cost per case, source error rate, task success, and time to recover from injected dependency failures. Baselines and targets for latency are set after a representative deployed baseline is measured; do not invent service-level guarantees.

---

## 11. Outcome measures and release acceptance

### 11.1 Primary business outcome

**Outcome O-01 — Analyst review efficiency:** target at least **25% reduction in median active review time** versus the defined manual baseline on matched synthetic invoice-exception tasks, **without reducing decision correctness**.

- **Unit:** minutes of active analyst work per completed case.
- **Baseline:** participants use the synthetic source systems/documents without EARS AI assistance, with equivalent case information.
- **Treatment:** participants use the EARS integrated review workspace and AI evidence assessment.
- **Method:** matched case sets, counterbalanced order, predeclared timing boundaries, equivalent instructions, and recorded errors/assistance.
- **Guardrail:** report correctness, material missed issues, and unsupported approvals separately; a faster but less correct result does not meet O-01.
- **Interpretation:** small-sample results are directional portfolio evidence, not real customer ROI.

### 11.2 Acceptance scorecard

| Outcome ID | Measure | Proposed acceptance target | Evidence |
|---|---|---|---|
| O-01 | Median active review time | ≥25% reduction with no lower decision correctness | `OUTCOME_REPORT.md` with raw anonymized timing/correctness data |
| O-02 | Canonical workflow completion | 6/6 demonstration scenarios pass on exact release candidate | E2E logs and evidence links |
| O-03 | Authorization | 0 unauthorized reads, context leaks, or actions in the defined negative suite | Security test report |
| O-04 | Mandatory policy compliance | 100% of positive/negative cases for POL-01…POL-07 pass | Rule test matrix |
| O-05 | AI citation support | ≥95% of evaluated factual claims supported by cited passages | Claim-level labeled evaluation; numerator/denominator reported |
| O-06 | Material issue detection | No critical issue omitted in the six demos; report recall on larger labeled set | Case-level evaluation and error analysis |
| O-07 | Abstention | Correct handling of all canonical missing/conflicting-source cases; broader error rates reported | Dedicated evaluation subset |
| O-08 | Final decision integrity | 0 duplicate final outcomes in defined retry/concurrency suite | Database integration results |
| O-09 | Audit reconstruction | Auditor can recover actor, rationale, controls, evidence versions and event sequence for every demo case | Reconstruction checklist |
| O-10 | Usability | ≥4/5 representative participants finish the primary task without facilitator intervention | Task protocol and observed outcomes |
| O-11 | Reproducibility | Fresh environment can install, seed, run tests and start deployed demo from documented steps | `RELEASE_EVIDENCE.md` |
| O-12 | Public demonstration safety | Synthetic labeling, no payment rails, and bounded AI usage verified | Release configuration review |

**Measurement discipline:** record case counts, participants, sampling, missing data, failure cases, and uncertainty. A threshold missed in honest evaluation is reported as missed—not reclassified as passed. Do not use AI-as-judge as the sole verifier of authorization, policy, or database integrity.

### 11.3 Operational definitions

- **Task success:** user reaches the correct authorized terminal or clarification state with required rationale and evidence.
- **Decision correctness:** disposition matches the pre-adjudicated synthetic case rubric, including valid abstentions/returns.
- **Citation support rate:** number of assessed factual claims supported by their cited passage divided by all assessed factual claims requiring support; exclude purely procedural UI text, disclose exclusions.
- **Material issue recall:** pre-labeled material issues surfaced divided by all pre-labeled material issues.
- **Unauthorized disclosure:** any restricted source content exposed via UI, API, log, retrieval result, or model prompt/response to an unauthorized actor.
- **Duplicate final decision:** more than one distinct final decision transition or finalization event for the same invoice under the defined lifecycle.
- **Audit reconstruction completeness:** proportion of mandatory reconstruction fields available and consistent with preserved records.
- **Active review time:** task timer excludes breaks and system-imposed waiting where distinguishable; also report wall-clock elapsed time to avoid hiding latency.

---

## 12. Evaluation plan for the portfolio engagement

### 12.1 Synthetic cases

Create representative invoice exceptions with golden outcomes and source citations: compliant milestone, over-limit PO, inactive vendor, missing memo, conflicting acceptance memo, duplicate or replayed request, stale record, ERP outage, and adversarial memo text. Maintain separate development and held-out evaluation cases.

### 12.2 AI assessment evaluation

Evaluate schema validity, citation support, material issue detection, uncertainty handling, abstention, and response latency/cost. Use human-verified labels for the held-out set. Do not equate fluent explanation with evidence correctness.

### 12.3 User outcome exercise

Recruit a small group of representative testers where feasible, use standardized instructions, alternate case order, and capture timing, task success, errors, assistance, and qualitative feedback. Clearly state sample limitations. If recruitment is not possible, perform a documented self-run benchmark but **do not claim independent usability evidence**.

### 12.4 Interview demonstration

The portfolio walkthrough should show:

1. The customer's operational problem and baseline.
2. One supported invoice completed end to end.
3. An AI assessment grounded in a milestone memo, including clickable citations.
4. A deterministic blocker that AI cannot override.
5. A source outage or stale-evidence recovery path.
6. A manager's attributable decision and auditor reconstruction.
7. A short results scorecard, limitations, and architecture trade-offs.

---

## 13. FDE competency evidence map

| FDE capability | EARS artifact / behavior | Interview proof |
|---|---|---|
| Discovery and customer scoping | Problem hypotheses, user jobs, outcome targets | Explain why evidence synthesis is the costly step and why scope was constrained |
| Product judgment | Three primary screens and explicit non-goals | Show workflow prioritization and usable failure states |
| Enterprise integration | Mock ERP HTTP contracts, vendor adapter, source provenance | Demonstrate contract failure, retry, and authority boundaries |
| Applied AI engineering | Structured evidence assessment and evaluation | Show cited claim, abstention, and measured error modes |
| Enterprise security | Tenant/object authorization and role separation | Show denied unauthorized request and no leakage into model context |
| Transactional engineering | Durable approval state, replay protection, audit event atomicity | Show competing manager submissions yield one outcome |
| Full-stack delivery | End-to-end browser journey and deployment | Demonstrate the running application, not screenshots alone |
| Reliability | Source timeout/staleness handling, health checks, observability | Reproduce failure and recovery without unsafe approval |
| Outcome measurement | Controlled task exercise and outcome report | Report improvement and limitations without inflated claims |
| Communication and handoff | Architecture decisions, demo narrative, release evidence | Explain trade-offs to both business and technical stakeholders |

---

## 14. Delivery approach and phase handoffs

Follow the project operating model:

**User outcome → reference experience → architecture and data contracts → vertical slices → implementation → independent functional, visual, and data-integrity acceptance → release evidence → measured user outcome.**

These are **evidence checkpoints**, not an excuse for an eight-stage waterfall. Approve enough of Phases 1–3 to make a coherent first slice, then validate and revise the artifacts as evidence emerges.

| Phase | Required artifact | Exit evidence |
|---|---|---|
| 1. User outcome | `PRODUCT_BRIEF.md` | Customer fiction clearly labeled; personas, problem, scope, metrics, scenarios, non-goals approved |
| 2. Reference experience | `REFERENCE_EXPERIENCE.md` | Reference patterns, 3 screen specs, interaction states, accessibility and visual criteria approved |
| 3. Architecture and contracts | `ARCHITECTURE.md`, `DATA_CONTRACTS.md` | Authority boundaries, APIs, source/version models, transaction invariants, policy parameters specified |
| 4. Vertical slices | `VERTICAL_SLICES.md` | Each slice has user-visible value, dependency map, and measurable acceptance |
| 5. Implementation | Source and tests | Working integrated slice; meaningful automated tests |
| 6. Acceptance validation | `ACCEPTANCE_REPORT.md` | Functional, visual, authorization, data integrity, and failure tests independently reviewed where possible |
| 7. Release evidence | `RELEASE_EVIDENCE.md` | Exact commit/environment/deployment verified with reproducible artifacts |
| 8. Measured outcome | `OUTCOME_REPORT.md` | Observed task success, timing, correctness, caveats, and decision on whether target was achieved |

**Planned delivery slices:**

- **VS-01 — Non-AI workflow:** queue, sources, deterministic controls, analyst submission, manager decision, audit history.
- **VS-02 — AI assistance:** evidence synthesis, citations, abstention, model evaluation.
- **VS-03 — Enterprise boundaries:** authorization, multi-tenant negative tests, durable state, source failures, stale review, concurrency.
- **VS-04 — Delivery evidence:** deploy, demonstrate, run usability/outcome study, publish measured results.

The final slice boundaries and sequencing are approved in Phase 4; they are not a mandate to build new subsystems if the existing implementation already meets requirements.

---

## 15. Phase 1 acceptance checklist

| Gate | Acceptance condition | Evidence in this brief |
|---|---|---|
| PB-G01 | Product category and portfolio purpose unambiguous | Sections 1 and 13 |
| PB-G02 | Fictional customer and assumptions transparently labeled | Sections 2 and 11 |
| PB-G03 | Primary user jobs, permissions and human authority defined | Section 3 |
| PB-G04 | One bounded invoice exception workflow with clear exclusions | Sections 4–5 |
| PB-G05 | AI's useful responsibility distinguished from deterministic rules | Section 5.1 |
| PB-G06 | Three primary screens and critical failure states identified | Section 6 |
| PB-G07 | Stable functional requirement IDs and verification methods present | Section 7 |
| PB-G08 | Mandatory controls and unresolved parameter decisions explicit | Section 8 |
| PB-G09 | Six demonstrations and separate security coverage defined | Section 9 |
| PB-G10 | Nonfunctional, security and operational expectations specified | Section 10 |
| PB-G11 | Outcome metrics, denominators, baseline method and limitations defined | Sections 11–12 |
| PB-G12 | Handoff to reference experience and downstream traceability defined | Section 14 |

**Phase 1 document decision:** The above gates are specified and ready for product-owner review. **Do not record the product brief as formally approved until the owner accepts the scope and unresolved decisions below.**

---

## 16. Open decisions to resolve in subsequent phases

| ID | Decision | Owner / due phase | Constraint |
|---|---|---|---|
| OD-01 | Exact PO/milestone amount thresholds and manager authority levels | Product owner + Phase 3 | Must be synthetic and versioned |
| OD-02 | Freshness window and material-change invalidation semantics | Phase 3 | Stale sources cannot silently authorize approval |
| OD-03 | Return-for-clarification lifecycle and resubmission rules | Phase 2–3 | Must preserve history and prevent double finalization |
| OD-04 | Evidence version/snapshot storage and citation addressing | Phase 3 | Auditor must reconstruct the reviewed version |
| OD-05 | Demo identity method and hosted access restrictions | Phase 3 | Must not misrepresent demo auth as enterprise SSO |
| OD-06 | Relational database and hosting choice | Phase 3 | Favor minimal reliable implementation |
| OD-07 | AI provider and spend controls | Phase 3 | Live demo bounded; replay mode explicitly labeled |
| OD-08 | Benchmark case counts and evaluator labeling protocol | Phase 4/6 | Disclose sample sizes and uncertainty |
| OD-09 | Reference products and visual design benchmarks | Phase 2 | Judge usability against actual professional patterns |
| OD-10 | Existing repository reuse versus replacement per module | Phase 3/4 | Inspect before rewriting; preserve accepted behavior |

---

## 17. Final product definition

**EARS succeeds as a portfolio project when a reviewer can watch an analyst resolve a realistic invoice exception with source-grounded AI assistance, observe deterministic controls prevent an unsafe approval, see an authorized manager record a durable decision, reconstruct the evidence as an auditor, and inspect credible tests and measurements demonstrating the system's behavior.**

The strongest portfolio claim is not that EARS is a production-certified financial platform. It is that the developer demonstrated the judgment and engineering discipline required to deliver a bounded enterprise AI workflow from customer problem through measured outcome.

**Next authorized work:** Phase 2 — `REFERENCE_EXPERIENCE.md`. Define the professional reference experience, actual screen flows, content hierarchy, interaction states, visual quality criteria, and representative synthetic records **before** expanding implementation.