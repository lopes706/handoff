# Deployment and source verification

No deployment is part of this delivery. Revalidate token identifiers immediately before any future transaction against the [Celo stablecoin registry](https://docs.celo.org/build-on-celo/build-with-local-stablecoin) and [Stacks sBTC integration guide](https://docs.stacks.co/clarinet/integrations/sbtc).

## Environment

Public app values: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_TALENT_PROJECT_VERIFICATION`, selected Celo/Stacks networks, Handoff contract identifiers, deployment block, official USDT/sBTC identifiers, and RPC/API URLs. Private operator values: `PRIVATE_KEY`, network RPC URLs, per-network deployed Celo addresses, verification credentials, `STACKS_PRIVATE_KEY`, selected deployment network, deployed Stacks IDs, and positive `STACKS_DEPLOY_FEE_MICROSTX`.

Copy `.env.example`; never commit a populated file. `npm run check:env` validates formats and cross-network asset choices. Scripts print outputs and never rewrite an environment file.

## Testnet first

1. Revalidate official token IDs and endpoints.
2. Run `npm run verify:full` and private operator tests.
3. Fund a dedicated deployer with the minimum network gas only.
4. `npm run deploy:celo:sepolia` or `npm run deploy:stacks:testnet`.
5. Record every printed identifier manually, then verify Celo source with the matching command.
6. Configure a local app build and run all three isolated QA scenarios.
7. Repeat adversarial and mobile wallet checks before considering mainnet.

## Mainnet gate

Repeat compilation and tests from a clean checkout, revalidate official registries, compare bytecode/source, independently review the immutable no-rescue design, set fee ceilings, and rehearse journal recovery. The ignored mainnet operator is dry-run by default and requires exact phrases for funding or scenarios. Deployment output must record chain/network, contract, transaction, block when available, asset, cap, and explorer.
