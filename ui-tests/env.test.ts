import { describe, expect, it } from "vitest";
import { deployments } from "@/lib/deployments";

describe("canonical deployments", () => {
  it("ships the verified mainnet identifiers used by zero-config builds", () => {
    expect(deployments.celo.celo).toMatchObject({
      chainId: 42220,
      contractAddress: "0xA812BEA5a26A5C8674F6a81562A4206B645dfa39",
      deploymentBlock: "72266026",
    });
    expect(`${deployments.stacks.mainnet.contractAddress}.${deployments.stacks.mainnet.contractName}`)
      .toBe("SP3MK1ZMFEY1MJJ58ZTCFP6BRE51ZXAR3S77E4EZ0.handoff-escrow");
  });

  it("keeps testnet contract identifiers explicitly unconfigured", () => {
    expect(deployments.celo.celoSepolia.contractAddress).toBe("");
    expect(deployments.stacks.testnet.contractAddress).toBe("");
  });
});

