# EARS engineering runbook

## One-time setup
1. Clone `https://github.com/xcross20/EARS.git`.
2. Fetch branches and check out `feat/ears-001-foundation` while draft PR #1 is open. Do not work on `main` yet: it only contains the initial README.
3. Create an implementation branch from the foundation branch: `git switch -c feat/ears-001-app`.
4. Confirm `git status --short` is empty; read `AGENTS.md` and `work_orders/EARS-001.md`.
5. Start a Grok CLI coding session in this repository, instructing it to execute only EARS-001 and leave evidence. Grok CLI command flags vary by installed version; use `grok --help` locally rather than assuming headless flags.

## Suggested agent kickoff prompt
`You are the EARS Builder. Read AGENTS.md, MISSION.md, STRATEGY.md, AUTONOMY.md, NEXT.md, docs/user-journey-J001.md, docs/threat-model.md and work_orders/EARS-001.md. Execute EARS-001 only on the current feature branch. Implement the smallest working browser slice with server-enforced demo permissions and tests. Run available checks, record exact commands/results in research/autonomous/EARS-001-builder-report.md, commit your implementation, then STOP. Do not self-approve, merge, deploy or start EARS-002.`

## Independent review and decision
Use a distinct review session/context to inspect the diff and rerun relevant tests. Record review in `research/autonomous/EARS-001-review.md`. Only an actual Controller implementation, after validating evidence and reviewer verdict, may record ACCEPT and advance NEXT. Until the VentureOS adapter is verified, perform this gate explicitly and do not claim continuous autonomous execution.

## Existing foundation branch
Draft PR: https://github.com/xcross20/EARS/pull/1. Human review and merge remain required.
