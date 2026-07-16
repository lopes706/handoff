import type { Address } from "viem";
import type { Network } from "./types";

export type CeloNetwork = "celo" | "celoSepolia";
export type StacksNetwork = "mainnet" | "testnet";
const read = (value: string | undefined, fallback = "") => value?.trim() || fallback;
const celoNetwork = (read(process.env.NEXT_PUBLIC_CELO_NETWORK, "celo") === "celo" ? "celo" : "celoSepolia") as CeloNetwork;
const stacksNetwork = (read(process.env.NEXT_PUBLIC_STACKS_NETWORK, "mainnet") === "mainnet" ? "mainnet" : "testnet") as StacksNetwork;

export const publicEnv = {
  appUrl: read(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"),
  talentVerification: read(process.env.NEXT_PUBLIC_TALENT_PROJECT_VERIFICATION),
  celoNetwork,
  celoContractAddress: read(process.env.NEXT_PUBLIC_HANDOFF_CELO_CONTRACT_ADDRESS) as Address | "",
  celoDeploymentBlock: read(process.env.NEXT_PUBLIC_HANDOFF_CELO_DEPLOYMENT_BLOCK),
  celoUsdtAddress: read(process.env.NEXT_PUBLIC_HANDOFF_CELO_USDT_ADDRESS, celoNetwork === "celo" ? "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e" : "0xd077A400968890Eacc75cdc901F0356c943e4fDb") as Address,
  celoMainnetRpc: read(process.env.NEXT_PUBLIC_CELO_MAINNET_RPC_URL, "https://forno.celo.org"),
  celoSepoliaRpc: read(process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL, "https://forno.celo-sepolia.celo-testnet.org"),
  stacksNetwork,
  stacksContractAddress: read(process.env.NEXT_PUBLIC_HANDOFF_STACKS_CONTRACT_ADDRESS),
  stacksContractName: read(process.env.NEXT_PUBLIC_HANDOFF_STACKS_CONTRACT_NAME, "handoff-escrow"),
  stacksSbtcContractId: read(process.env.NEXT_PUBLIC_STACKS_SBTC_CONTRACT_ID, stacksNetwork === "mainnet" ? "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token" : "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token"),
  stacksMainnetApi: read(process.env.NEXT_PUBLIC_STACKS_API_MAINNET, "https://api.hiro.so"),
  stacksTestnetApi: read(process.env.NEXT_PUBLIC_STACKS_API_TESTNET, "https://api.testnet.hiro.so")
};

export const getCeloChainId = () => publicEnv.celoNetwork === "celo" ? 42220 : 11142220;
export const getCeloRpc = () => publicEnv.celoNetwork === "celo" ? publicEnv.celoMainnetRpc : publicEnv.celoSepoliaRpc;
export const getCeloExplorer = () => publicEnv.celoNetwork === "celo" ? "https://celoscan.io" : "https://celo-sepolia.blockscout.com";
export const getStacksApi = () => publicEnv.stacksNetwork === "mainnet" ? publicEnv.stacksMainnetApi : publicEnv.stacksTestnetApi;
export const contractConfigured = (network: Network) => network === "celo" ? /^0x[0-9a-fA-F]{40}$/.test(publicEnv.celoContractAddress) : Boolean(publicEnv.stacksContractAddress && publicEnv.stacksContractName);
export const contractId = (network: Network) => network === "celo" ? publicEnv.celoContractAddress : `${publicEnv.stacksContractAddress}.${publicEnv.stacksContractName}`;
export const networkId = (network: Network) => network === "celo" ? String(getCeloChainId()) : publicEnv.stacksNetwork;
export const txExplorerUrl = (network: Network, hash: string) => network === "celo"
  ? `${getCeloExplorer()}/tx/${hash}`
  : `https://explorer.hiro.so/txid/${hash.startsWith("0x") ? hash : `0x${hash}`}?chain=${publicEnv.stacksNetwork}`;
export const contractExplorerUrl = (network: Network) => network === "celo"
  ? `${getCeloExplorer()}/address/${publicEnv.celoContractAddress}`
  : `https://explorer.hiro.so/contract-call/${publicEnv.stacksContractAddress}/${publicEnv.stacksContractName}?chain=${publicEnv.stacksNetwork}`;
