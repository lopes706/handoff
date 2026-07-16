# Deployment and source verification

Handoff is deployed on Celo and Stacks mainnet but remains unaudited. Revalidate token identifiers before operator funding against the [Celo stablecoin registry](https://docs.celo.org/build-on-celo/build-with-local-stablecoin) and [Stacks sBTC integration guide](https://docs.stacks.co/clarinet/integrations/sbtc).

Canonical application defaults:

- Celo escrow `0xA812BEA5a26A5C8674F6a81562A4206B645dfa39`, deployment block `72266026`.
- Stacks escrow `SP3MK1ZMFEY1MJJ58ZTCFP6BRE51ZXAR3S77E4EZ0.handoff-escrow`.
- Official mainnet USDT and sBTC identifiers from `.env.example`.

## Environment

Public app values: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_TALENT_PROJECT_VERIFICATION`, selected Celo/Stacks networks, optional Handoff deployment overrides, official USDT/sBTC identifiers, and RPC/API URLs. Mainnet app builds fall back to the canonical identifiers above; testnet builds do not. Private operator values: `PRIVATE_KEY`, network RPC URLs, per-network deployed Celo addresses, verification credentials, `STACKS_PRIVATE_KEY`, selected deployment network, deployed Stacks IDs, and positive `STACKS_DEPLOY_FEE_MICROSTX`.

Copy `.env.example`; never commit a populated file. `npm run check:env` validates formats and cross-network asset choices. Scripts print outputs and never rewrite an environment file.

## Testnet first

1. Revalidate official token IDs and endpoints.
2. Run `npm run verify:full` and private operator tests.
3. Fund a dedicated deployer with the minimum network gas only.
4. `npm run deploy:celo:sepolia` or `npm run deploy:stacks:testnet`.
5. Record every printed identifier manually, then verify Celo source with the matching command.
6. Configure a local app build and run all three isolated QA scenarios.
7. Repeat adversarial and mobile wallet checks before considering mainnet.

## Mainnet operator

Repeat compilation and tests from a clean checkout, revalidate official registries, compare bytecode/source, independently review the immutable no-rescue design, set fee ceilings, and rehearse journal recovery. The ignored operator creates 12 private wallets per chain, swaps and seeds one reusable minimum principal per pair with `assets`, equalizes only native gas with `fund`, and runs six paired escrow scenarios with `run`. Run `create → assets → fund → run` in that order. Subsequent runs derive each buyer from the pair's current principal holder, so successful payments rotate roles while refunds retain them. Every mutating command prints its complete exposure before requiring an exact confirmation phrase; `--yes` is reserved for explicitly authorized automation. Journals record signed transactions before broadcast and are resumable.
