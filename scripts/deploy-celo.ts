import hre from "hardhat";
import { serverEnv } from "../lib/server-env";

async function main() {
  const selected = hre.globalOptions.network; if (!new Set(["celo", "celoSepolia"]).has(selected)) throw new Error("Deployment is restricted to celo or celoSepolia.");
  if (!/^0x[0-9a-fA-F]{64}$/.test(serverEnv.privateKey)) throw new Error("Missing or invalid PRIVATE_KEY.");
  const token = selected === "celo" ? serverEnv.celoMainnetUsdt : serverEnv.celoSepoliaUsdt;
  const expected = selected === "celo" ? "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e" : "0xd077A400968890Eacc75cdc901F0356c943e4fDb";
  if (token.toLowerCase() !== expected.toLowerCase()) throw new Error("USDT constructor address does not match the selected network.");
  const { ethers } = await hre.network.create(); const chain = await ethers.provider.getNetwork(); const wanted = selected === "celo" ? 42220n : 11142220n; if (chain.chainId !== wanted) throw new Error(`RPC returned chain ${chain.chainId}, expected ${wanted}.`);
  const code = await ethers.provider.getCode(token); if (code === "0x") throw new Error("The configured USDT address has no code on this RPC.");
  const contract = await ethers.deployContract("HandoffEscrow", [token]); const transaction = contract.deploymentTransaction(); await contract.waitForDeployment(); const receipt = transaction ? await transaction.wait() : null; const address = await contract.getAddress(); const explorer = selected === "celo" ? "https://celoscan.io" : "https://celo-sepolia.blockscout.com";
  console.log("HandoffEscrow deployed"); console.log("network:", selected); console.log("chainId:", chain.chainId.toString()); console.log("address:", address); console.log("deploymentTx:", transaction?.hash || ""); console.log("deploymentBlock:", receipt?.blockNumber || ""); console.log("USDT:", token); console.log("capBaseUnits:", "50000000"); console.log("explorer:", `${explorer}/address/${address}`);
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
