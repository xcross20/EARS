# Decision ledger
## Bootstrap
- Decision: establish mission/strategy/governance and first user journey before implementation.
- Status: documentation bootstrap only; not an accepted implementation cycle.
- Rationale: avoid infrastructure-first overengineering.
- Evidence: repository commits and subsequent independent checks required.

## Controller decision schema
Record: work_order, branch, builder_commit, reviewer_identity, checks_with_commands_and_exit_codes, defects, decision (CONTINUE/ACCEPT/BLOCKED/RETHINK), rationale, next_work_order.
