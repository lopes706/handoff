# Threat model

Handoff reduces settlement ambiguity; it does not remove counterparty, device, or wallet risk.

| Threat                         | Consequence                                        | Control / remaining risk                                                                                                         |
| ------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Deal-link leakage              | Terms become readable                              | Fragment avoids server transmission; checksum detects edits. It is bearer-readable, not encrypted.                               |
| Release-pass leakage           | Seller may complete after handover context is lost | Buyer warning, fresh secret per funding, deployment/deal validation. Never send the pass early.                                  |
| Ticket loss                    | Seller QR claim becomes unavailable                | IndexedDB plus export/import. Buyer can still confirm directly from the recorded wallet. No recovery key.                        |
| Buyer non-cooperation          | Seller cannot force release without the pass       | Seller should hand over only while buyer confirms or shows the pass. This is deliberate buyer control.                           |
| Seller non-cooperation         | Buyer waits for expiry                             | Seller can refund early; anyone can trigger refund at expiry.                                                                    |
| Expiry race                    | Completion and refund compete                      | Completion is `< expiry`; refund is `>= expiry`; chain ordering decides one terminal transition.                                 |
| Self-deal/activity farming     | Misleading raw counts                              | Self-funding is blocked. Counts are labelled descriptive activity, never reputation or trust. Other collusion remains possible.  |
| Wallet compromise              | Attacker acts as wallet                            | No app account or override exists. Use wallet/device security and inspect prompts.                                               |
| Direct token transfer          | Assets bypass deal accounting                      | Unsupported and unrecoverable; contracts intentionally have no rescue/admin path.                                                |
| Sheet mutation/deployment swap | Buyer funds wrong facts or contract                | Sheet checksum plus onchain terms/reference/network/contract comparison blocks funding.                                          |
| QR scanner substitution        | Wrong secret/deal submitted                        | Seller scanner validates checksum, network, contract and deal; the contract validates the secret against the onchain commitment. |
| Fee-on-transfer/fake token     | Liability undercollateralization                   | Celo enforces exact balance increase and immutable official token binding; deploy scripts reject mismatches.                     |

There is no shipping protection, evidence review, arbitration, chargeback, support recovery, custody outside funded deals, or production-safety claim.
