const read = (value: string | undefined, fallback = "") => value?.trim() || fallback;
export const serverEnv = {
  privateKey: read(process.env.PRIVATE_KEY),
  celoMainnetRpc: read(process.env.CELO_MAINNET_RPC_URL, "https://forno.celo.org"),
  celoSepoliaRpc: read(process.env.CELO_SEPOLIA_RPC_URL, "https://forno.celo-sepolia.celo-testnet.org"),
  celoMainnetUsdt: read(process.env.CELO_USDT_ADDRESS_MAINNET, "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e"),
  celoSepoliaUsdt: read(process.env.CELO_USDT_ADDRESS_SEPOLIA, "0xd077A400968890Eacc75cdc901F0356c943e4fDb"),
  celoMainnetAddress: read(process.env.HANDOFF_CELO_CONTRACT_ADDRESS_MAINNET),
  celoSepoliaAddress: read(process.env.HANDOFF_CELO_CONTRACT_ADDRESS_SEPOLIA),
  etherscanApiKey: read(process.env.ETHERSCAN_API_KEY),
  celoscanApiKey: read(process.env.CELOSCAN_API_KEY),
  stacksPrivateKey: read(process.env.STACKS_PRIVATE_KEY),
  stacksNetwork: read(process.env.STACKS_NETWORK, "mainnet"),
  stacksDeployFee: Number(read(process.env.STACKS_DEPLOY_FEE_MICROSTX, "300000"))
};
