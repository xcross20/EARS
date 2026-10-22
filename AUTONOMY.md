# Autonomous execution contract
## Roles
- **Human owner:** approves mission changes, risk boundaries, deployment and material scope changes.
- **Planner:** decomposes approved strategy into bounded, testable work orders.
- **Controller:** reads NEXT/STATE, leases work, enforces limits, runs checks, decides CONTINUE / ACCEPT / BLOCKED / RETHINK. Deterministic gates take precedence over LLM opinion.
- **Builder (Grok CLI):** changes only approved paths, implements tests, reports evidence; does not self-approve.
- **Independent Reviewer:** inspects diff, runs/validates checks, identifies defects and security regressions.
- **Rethinker:** challenges strategy, not just implementation; uses Defender, Adversarial Falsifier, First-Principles Architect and Synthesizer viewpoints. Proposals require explicit human approval for strategy changes outside delegated bounds.

## Execution protocol
1. Verify branch and clean working tree; never work on main.
2. Read MISSION, STRATEGY, NEXT, STATE and work-order acceptance criteria.
3. Builder executes one bounded slice with time/retry limits.
4. Reviewer independently assesses changed code and evidence; authorization tests are mandatory when relevant.
5. Controller records decision and commit IDs in DECISION.md; only ACCEPT advances NEXT.
6. BLOCKED preserves state; no fabricated passes, forced merges or bypassed gates.

## Safety
No real customer data, external transactions, secrets in repository, production deployments, or autonomous branch protection changes. A human approves merges and external side effects.
