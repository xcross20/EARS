# EARS-AUT-001 reuse assessment

Inspected on 2026-10-16. Neither Rally nor VentureOS was modified.

## Decision

Use a thin EARS TypeScript gate (`lib/autonomy/gate.ts`) that copies Rally's rule "a model recommendation is not evidence." Do not import Rally or VentureOS. Their runtimes, decision tokens, and side effects do not match this pilot.

## Rally

- Repository: `xcross20/rally_top_signal_tester`
- Commit: `3e74c6ea0d84bc734deeccb5b20c86c6be8d45de`
- Interface: `src/autonomy/cycle.py` `run_cycle`, `src/autonomy/decisions.py` `parse_decision`, `src/autonomy/loop.py` `run_cycles`. The controller result must set `inspected_diff` and echo `diff_sha256`. A mismatch raises `InvalidDecision` (`src/autonomy/cycle.py` around the `_assert_controller_inspected_diff` check).
- Tokens: `CONTINUE`, `COMPLETE`, `BLOCKED`, `SAFETY_STOP`. `ACCEPT` is a research-verdict word and is rejected as a runtime token (`tests/autonomy/test_decisions.py`, `AUTONOMY.md`).
- Tests: `tests/autonomy/test_cycle.py`, `test_decisions.py`, `test_artifacts.py`, `test_governance.py`, `test_grok_provider.py`.
- Adaptation: the hash-binding idea is reused as "check records must carry the reviewed SHA." The Python package imports `src.autonomy`, writes Rally `NEXT.md`, and can launch a paid Grok provider (`scripts/autonomy/grok_provider.py`). Importing it would pull a trading research loop into EARS.
- Missing for EARS: npm/Playwright evidence, the EARS decision words `ACCEPT` and `RETHINK`, session and tenant probes, and the durability rule in `work_orders/EARS-003.md`.
- Complexity to adapt in place: high. A wrong import can change Rally governance. Not justified for one pilot.

## VentureOS

- Repository: `xcross20/ventureos`
- Commit: `4b119d39d4ad71f7ff8a96a0ca7c22537f3fc1aa`
- Interface: `packages/control-plane/src/index.ts` `ControlPlane`, `packages/control-plane/src/worker-loop.ts` `applyFailure` with lease, retry, and backoff. `packages/schema-guard` validates `schemas/v1/work_order.schema.json`. `packages/domain/src/lifecycle.ts` classifies evidence. `packages/github/src/merge-gate.ts` can treat CI conclusions as merge input. `packages/control-plane/src/preview-gate.ts` can deploy a Railway preview.
- Tests: `tests/acceptance/agent-evidence-timeline.test.ts` and `tests/playwright/agent.spec.ts` cover evidence categories, not an EARS invoice review.
- Adaptation: importing the control plane would take a deploy and merge path into a pilot that forbids both. The package graph is an application platform, not a library with a stable Controller entry for an external repo.
- Missing for EARS: the invoice security probes and the rule that `npm audit` exit 1 stays a recorded failure.
- Complexity: high. Reuse would mean standing up VentureOS cells. That violates "do not build a general orchestration platform."

## EARS

- Repository: `xcross20/EARS`
- Product candidate: `1c84e36f768b7723f990911fdbd4b91cdd20a46b`
- Existing contract: `AUTONOMY.md` roles and `DECISION.md` tokens `CONTINUE / ACCEPT / BLOCKED / RETHINK`. There is no cycle runner. Prior reviews were manual agent sessions.
- This pilot adds `lib/autonomy/gate.ts` and `tests/autonomy-gate.test.ts`. The gate returns a decision from recorded checks. It does not accept a reviewer `ACCEPT` string by itself. It does not merge or deploy.
