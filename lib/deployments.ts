export const deployments = {
  celo: {
    celo: {
      chainId: 42220,
      contractAddress: "0xA812BEA5a26A5C8674F6a81562A4206B645dfa39",
      deploymentBlock: "72266026",
      usdtAddress: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
    },
    celoSepolia: {
      chainId: 11142220,
      contractAddress: "",
      deploymentBlock: "",
      usdtAddress: "0xd077A400968890Eacc75cdc901F0356c943e4fDb",
    },
  },
  stacks: {
    mainnet: {
      contractAddress: "SP3MK1ZMFEY1MJJ58ZTCFP6BRE51ZXAR3S77E4EZ0",
      contractName: "handoff-escrow",
      sbtcContractId: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
    },
    testnet: {
      contractAddress: "",
      contractName: "handoff-escrow",
      sbtcContractId: "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token",
    },
  },
} as const;

