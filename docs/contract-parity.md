# Contract parity matrix

| Behavior | Celo `HandoffEscrow.sol` | Stacks `handoff-escrow.clar` |
|---|---|---|
| Asset | immutable constructor-bound USDT | official requirement/remapped sBTC |
| Cap | `50_000_000` (6 decimals) | `u50000` sats |
| IDs | sequential `uint256`; bytes32 reference map | sequential `uint`; buff-32 reference map |
| Times | `block.timestamp` | `stacks-block-time` |
| Completion boundary | `< expiresAt` | `< expires-at` |
| Expired refund boundary | `>= expiresAt` | `>= expires-at` |
| Secret check | `sha256(abi.encodePacked(secret))` | `sha256 secret` |
| Funding safety | exact balance delta, SafeERC20, nonReentrant | SIP-010 transfer plus exact-deny UI post-condition |
| Outgoing safety | effects before SafeERC20 transfer | effects before guarded Clarity 4 `as-contract?` FT allowance |
| Administration | none | none |
| Fees/upgrades/pause/rescue | none | none |
| History | created/funded indexed arrays | created/funded indexed maps |
| Activity | six neutral counters | same six neutral counters |

Solidity custom errors and Clarity codes `u400`–`u415` map to the same frontend messages. Creation resolves its sequential ID through the random reference after confirmation; the frontend never races on a global counter.
