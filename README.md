# Handoff

Handoff is buyer-controlled, backendless escrow for a small in-person exchange. A seller creates an unlisted deal sheet, a buyer locks up to 50 USDT on Celo or 50,000 sats on Stacks, and the buyer releases only after inspecting the item. The buyer can confirm in their wallet or show the seller a one-time release pass.

This repository is code-ready and deployed on Celo and Stacks mainnet, but remains unaudited. It performs no shipping, dispute resolution, arbitration, trust scoring, account recovery, custody outside funded deals, or support override.

## Lifecycle

`Open → Funded → Completed` for a successful handoff. In user-facing copy, that terminal success is described as the buyer releasing the handoff after inspection or the seller claiming with the one-time release pass. A seller may move a funded deal to `Refunded` at any time; at expiry anyone may trigger that same return to the recorded buyer. An unfunded deal may be `Cancelled`. No terminal deal transitions again.

Human-readable terms never enter a Handoff database: they live in a checksummed URL fragment or `.handoff.json` file, and only their SHA-256 hash is onchain. The fragment is omitted from HTTP requests, but anyone with the deal sheet link or portable file can still read it because neither is encrypted.

## Stack and structure

- Next.js 16, React 19, TypeScript, Viem, Stacks Connect/Transactions
- Solidity 0.8.24, Hardhat 3, OpenZeppelin 5
- Clarity 4, Clarinet SDK, official sBTC requirement/remapping
- Vitest, Playwright, axe
- `app/`, `components/`, `lib/repositories/`, `contracts/`, `stacks/contracts/`, `test/`, `ui-tests/`, `e2e/`, `scripts/`, `docs/`
- ignored `.home/` operator pools, journals, planners, and mainnet QA tooling

The app reads contracts directly through a Celo RPC or Stacks API. It has no application server, database, indexer, analytics SDK, or fabricated live state. A missing contract address produces an explicit setup screen; local UI previews are opt-in and clearly marked.

## Local setup

Use Node 22.13 or newer.

```bash
npm ci
cp .env.example .env
npm run dev
```

Use `.env.local` only for local Next.js-only overrides. The shared default
setup lives in `.env` so `npm run check:env` and the deployment scripts read
the same values.

Open `http://localhost:3000` for the landing page, or jump straight to these
local routes:

- `http://localhost:3000/app/celo` for the Celo deals dashboard
- `http://localhost:3000/app/celo/new` to create a new Celo deal sheet
- `http://localhost:3000/app/stacks` for the Stacks deals dashboard
- `http://localhost:3000/app/stacks/new` to create a new Stacks deal sheet

Verified mainnet identifiers are built-in defaults; environment values can override them for another reviewed deployment. Testnet contract addresses remain required. See [deployment.md](docs/deployment.md) for every variable and the testnet-first workflow.

## Verification

```bash
npm run lint
npm run typecheck
npm run compile:celo
npm run test:celo
npm run check:stacks
npm run test:stacks
npm run test:ui
npm run build
npm run test:e2e
npm run test:a11y
npm run verify
npm run verify:full
node --test .home/tests/*.test.mjs
```

Direct token transfers to either escrow contract are unsupported and unrecoverable. Buyer release is irreversible: inspect the item first.

## Specifications

- [Exact deal rules](docs/deal-rules.md)
- [Contract parity](docs/contract-parity.md)
- [Brand and interface](docs/brand-ui.md)
- [Threat model](docs/threat-model.md)
- [Deployment and verification](docs/deployment.md)
- [Launch checklist](docs/launch-checklist.md)
- [Talent readiness](docs/talent-readiness.md)
