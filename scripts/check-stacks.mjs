import fs from "node:fs";

const source = fs.readFileSync("stacks/contracts/handoff-escrow.clar", "utf8");
const required = [
  "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
  "(define-public (create-deal",
  "(define-public (fund-deal",
  "(define-public (confirm-handoff",
  "(define-public (claim-handoff",
  "(define-public (refund-deal",
  "(define-public (refund-expired",
  "(define-public (cancel-deal",
  "MAX-AMOUNT u50000"
];
for (const marker of required) if (!source.includes(marker)) throw new Error(`Missing required Clarity marker: ${marker}`);
if (/define-public\s+\(set-|contract-owner|fee-recipient|upgrade|pause/i.test(source)) throw new Error("Privileged or upgrade-like surface detected.");
console.log("Stacks source contains the required immutable Handoff interface and sBTC binding.");
