# EARS-AUT-001 execution report

Pilot kickoff was the EARS-AUT-001 work order. One continuation session ran the remaining loop after the first review and the durability repair already existed.

## Decisions

| Cycle | SHA | Controller decision |
| --- | --- | --- |
| 001 | `1c84e36f768b7723f990911fdbd4b91cdd20a46b` | CONTINUE |
| 002 | `02392bea6d73a49aacc10cdcd25420ca1ca27fd3` | ACCEPT |

Product decision: **ACCEPT** EARS-003 engineering scope at `02392bea6d73a49aacc10cdcd25420ca1ca27fd3`.

Harness decision: this pilot demonstrated the section 15 loop on this work order. It does not certify `lib/autonomy/gate.ts` as a general controller. Rally (`3e74c6ea0d84bc734deeccb5b20c86c6be8d45de`) and VentureOS (`4b119d39d4ad71f7ff8a96a0ca7c22537f3fc1aa`) were inspected and not imported. See `research/autonomous/EARS-AUT-001-reuse-assessment.md`.

## What ran

- Independent review 1, session `01a14631-0116-7471-a830-5a230e886a75`, worktree `/tmp/ears-003-r01`. Durability failed restart. Security probes and a single-process race passed. Audit exit 1.
- Repair 1, builder session `01a1452e-fba4-7b12-b473-50b9d5a66c7f`, worktree `/tmp/ears-003-repair`, commit `02392bea6d73a49aacc10cdcd25420ca1ca27fd3`. Scope was file persistence for workflow and session revocation. Dependencies were not upgraded. Controller rules were not edited by the repair.
- Independent review 2, session `01a14644-5e16-7df0-902a-37f8b689abbd`, worktree `/tmp/ears-003-r02`, 985 seconds. Recommendation `NO_MATERIAL_DEFECTS`. The gate, not that sentence, returned `ACCEPT`.
- Controller corroboration: audit re-run exit 1 with the same seven advisories; a separate three-process restart check kept `evt_FbQ-5ZzchOHa` and `evt_9xutvccCeMJz`, kept the revoked analyst cookie rejected, and left payment at HTTP 403.

## Limits

Repair attempts used: 1 of 2. No merge. No deployment. No live xAI call. No external `.env` read in this continuation. No second product work order. `npm audit` was not fixed. Governance ledgers were not edited before the cycle 002 gate returned `ACCEPT`.

## Limitations

Builder and cycle 001 durations were not retained as measurements. Cost was not instrumented. Concurrency evidence is single-process. Local JSON state is not a tamper-proof log and has no cross-process lock. The known dependency advisories remain a failing audit.

Ledger commit: `e5fddf67df702c6194a9dc391b5336f5ff8c63a0` on `control/ears-003-accept`, parent `02392bea6d73a49aacc10cdcd25420ca1ca27fd3`. It updates `DECISION.md`, `STATE.md`, and `NEXT.md` only. `acceptanceAlreadyRecorded` was false on the parent ledger and true after that commit. No second acceptance commit was made.
