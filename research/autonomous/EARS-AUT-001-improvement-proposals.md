# EARS-AUT-001 improvement proposals

These are observations. They do not change `lib/autonomy/gate.ts`, acceptance policy, or product code. Generating this file is not self-improvement.

## Metrics this pilot can support

| Item | Observed |
| --- | --- |
| Cycles | 2 |
| Repair attempts | 1 of 2 |
| Cycle 002 reviewer wall time | 985 seconds (session `01a14644-5e16-7df0-902a-37f8b689abbd`) |
| Cycle 001 reviewer wall time | Not retained as a measured duration in this session |
| Builder wall time | Not retained as a measured duration |
| Repeated defect category | Durability once, then closed on re-review |
| Mandatory test failures on cycle 002 | `npm audit --audit-level=critical` exit 1, same approved advisory set |
| Unsupported acceptance claims | None recorded. Cycle 001 did not accept. The gate ignored reviewer prose as acceptance evidence. |
| Human interventions after kickoff | None for stage handoff |
| Model or tool cost | Not instrumented. No live xAI product call was made. |

## Proposals

### 1. Bind check records to captured command logs

Expected benefit: a missing or mismatched exit code fails closed without reading reviewer prose. Cycle 002 required a controller re-run of `npm audit` because the evidence JSON was the reviewer's summary.

Regression risk: log scraping can record the wrong exit when a shell `echo` follows a failing command. That failure mode already happened on an earlier EARS combined script.

Evaluation: replay the cycle 001 and cycle 002 command lists from saved logs and require each exit code and SHA to match `test-results.json`. Promote only if both historical cycles reproduce and a fixture with a trailing `echo` still preserves audit exit 1.

### 2. Hold out a two-process decision race

Expected benefit: the accepted repair survives one process restart and a single-process `Promise.all`, and it does not serialize two `next start` processes. A holdout test would measure that gap instead of silently widening the acceptance rule.

Regression risk: a flaky file race could block a later demo that is still specified as one server. Promoting it into the gate without a scope decision would convert a residual into a surprise `BLOCKED`.

Evaluation: run two processes against one `EARS_STATE_DIR`, send approve and reject together, and record whether one terminal event remains. Compare that result to this pilot's single-process pass. Do not change the gate until that holdout has a written expected outcome.

### 3. Keep restart probes as a template, not a new framework

Expected benefit: cycle 001 lost `evt_cr2UtNUSzRHp` and `evt_DVp4c4LZ6QKA` on restart, and cycle 002 kept its event ids. A short template (wipe state dir, submit, decide, kill, start, compare event ids, revoke, kill, start, expect 401) is the check that made the repair reviewable.

Regression risk: a template that also starts browsers will dominate the three-hour budget.

Evaluation: time the HTTP restart script alone on the accepted SHA. Keep it only if it finishes in minutes and fails on the cycle 001 SHA.

No proposal here is authorized to edit the acceptance gate.
