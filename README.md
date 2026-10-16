# EARS — Enterprise AI Reference System

A synthetic financial-services invoice review and approval reference implementation, built through evidence-driven autonomous engineering.

**Status:** EARS-001 browser slice is implemented on `feat/ears-001-app` and is pending independent review. No production security, enterprise SSO, or real payment capability is claimed. The demo banner reads `DEMO — NOT PRODUCTION AUTH`.

## Mission
Demonstrate that AI-assisted enterprise workflows can be useful, authorization-safe, auditable, and measurably reliable while retaining human control of consequential actions.

## First journey
Analyst selects a synthetic invoice → retrieves permitted policies and mock ERP vendor data → reviews an evidence-grounded recommendation → submits → manager approves/rejects → auditor inspects the immutable-in-intent audit history.

EARS-001 implements the first step only: a simulated identity and the seeded invoice. Review, approval, and audit history are later work orders.

See `MISSION.md`, `STRATEGY.md`, `NEXT.md`, and `docs/` for scope. Never use real financial data or execute real payments.

## Local startup
Requires Node.js 22.

```bash
git clone https://github.com/xcross20/EARS.git
cd EARS
git switch feat/ears-001-app
cp .env.example .env.local
```

Edit `.env.local` and set `EARS_DEMO_SESSION_SECRET` to a private string of at least 16 characters. The value in `.env.example` is rejected on purpose.

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. Choose **Avery Chen**. The assigned invoice is `INV-HBR-2026-0042` for **$50,000.00**. On that invoice, **Run AI review** returns a cited recommendation. Without `XAI_API_KEY`, the draft is deterministic and no external model is called. The review is not an approval.

Stop the dev server with Ctrl-C. A production-mode local process is:

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

## Tests
Unit tests do not need the example secret.

```bash
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
```

`npm run test:e2e` builds the app and starts it with a throwaway signing secret. CI runs the same commands in `.github/workflows/ci.yml`.

## Authorization
The browser can select a seeded employee. The server then sets an httpOnly signed cookie. Role and tenant come from the seed, not from request headers or extra JSON fields. Cross-tenant invoice reads return 403. Approval and payment routes return 403 and do not move money.

## Architecture
`docs/adr/0001-next-fullstack-slice.md`
