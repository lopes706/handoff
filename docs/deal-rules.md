# Deal rules

## State boundaries

| Operation      | Required state | Authority                            | Time rule                        | Result            |
| -------------- | -------------- | ------------------------------------ | -------------------------------- | ----------------- |
| Create         | —              | seller                               | expiry is 5 minutes–30 days away | Open              |
| Fund           | Open           | intended buyer, or first valid buyer | at least 5 minutes remain        | Funded            |
| Confirm        | Funded         | buyer                                | strictly before expiry           | Completed         |
| Claim secret   | Funded         | seller                               | strictly before expiry           | Completed         |
| Refund early   | Funded         | seller                               | any time                         | Refunded          |
| Refund expired | Funded         | anyone                               | at or after expiry               | Refunded to buyer |
| Cancel         | Open           | seller                               | any time before funding          | Cancelled         |

Seller self-funding is rejected even for an open link. A named buyer cannot equal the seller. Amounts are positive and capped at 50,000,000 six-decimal USDT base units or 50,000 satoshis. A deal reference and terms hash must each be nonzero and a reference may be used once. Deals cannot be extended or settled twice.

At exactly `expiresAt`, completion is closed and expired refund is open. Funding accepts exactly five minutes remaining and rejects any lesser interval.

## Portable terms

`DealTermsV1` is fixed-order JSON with `version`, `dealRef`, `title`, `description`, and `meetingHint`. Strings are normalized to Unicode NFC, trimmed, and reject control characters. Limits are 80, 280, and 120 characters. `termsHash` is SHA-256 of that exact UTF-8 JSON.

`DealSheetV1` binds those terms to network, network ID, contract ID, deal ID, deal reference, terms hash, and creation time. Its checksum covers the entire fixed-order wrapper except the checksum itself. Mutation or deployment mismatch blocks funding.

## Release ticket

A buyer generates 32 random bytes before funding and commits `sha256(secret)` onchain. Pending tickets remain in IndexedDB after a failed approval or funding attempt. A full checksummed backup is importable. The compact release QR carries only its version, network, contract, deal ID, secret, and a checksum over those fields. The seller must match the network, contract, and deal before submitting the secret; the contract then verifies its commitment. Terminal settlement removes the secret and archives only non-secret transaction history.
