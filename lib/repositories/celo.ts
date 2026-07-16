import { createPublicClient, createWalletClient, custom, defineChain, http, parseEventLogs, type Address, type EIP1193Provider, type Hex, type TransactionReceipt } from "viem";
import { erc20Abi, handoffCeloAbi } from "../celo-abi";
import { contractConfigured, getCeloChainId, getCeloExplorer, getCeloRpc, publicEnv } from "../env";
import { resolutionByCode, statusByCode } from "../format";
import type { ActorActivity, HandoffDeal, HandoffRepository, TransactionObserver, TransactionReceiptSummary, TransactionStep } from "../types";
import { friendlyContractError } from "./errors";

export type InjectedProvider = EIP1193Provider & { isMiniPay?: boolean };
export const celoChain = defineChain({ id: getCeloChainId(), name: publicEnv.celoNetwork === "celo" ? "Celo" : "Celo Sepolia", nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 }, rpcUrls: { default: { http: [getCeloRpc()] } }, blockExplorers: { default: { name: "Celo Explorer", url: getCeloExplorer() } } });
const publicClient = createPublicClient({ chain: celoChain, transport: http(getCeloRpc()) });
const ZERO = "0x0000000000000000000000000000000000000000";
function values(raw: unknown) { return Array.isArray(raw) ? raw : Object.values(raw as Record<string, unknown>); }

export function mapCeloDeal(raw: unknown): HandoffDeal {
  const item = values(raw) as [bigint, Hex, Address, Address, Address, Hex, Hex, bigint, bigint, bigint, bigint, bigint, number, number];
  return { id: item[0], network: "celo", dealRef: item[1], seller: item[2], intendedBuyer: item[3] === ZERO ? null : item[3], buyer: item[4] === ZERO ? null : item[4], termsHash: item[5], releaseCommitment: item[6], amount: item[7], createdAt: Number(item[8]), expiresAt: Number(item[9]), fundedAt: item[10] ? Number(item[10]) : null, resolvedAt: item[11] ? Number(item[11]) : null, status: statusByCode[Number(item[12])] || "open", resolution: resolutionByCode[Number(item[13])] || "none" };
}
function mapActivity(raw: unknown): ActorActivity { const a = values(raw) as bigint[]; return { dealsCreated: a[0], dealsFunded: a[1], completedAsSeller: a[2], completedAsBuyer: a[3], refundedAsBuyer: a[4], refundsIssuedAsSeller: a[5] }; }
export function approvalSteps(allowance: bigint, exactAmount: bigint): TransactionStep[] { return allowance === exactAmount ? ["action"] : allowance === 0n ? ["approval", "action"] : ["reset-approval", "approval", "action"]; }

export function dealIdFromCreatedLogs(logs: TransactionReceipt["logs"], dealRef: Hex): bigint | undefined {
  const event = parseEventLogs({ abi: handoffCeloAbi, eventName: "DealCreated", logs, strict: true })
    .find(({ args }) => args.dealRef.toLowerCase() === dealRef.toLowerCase());
  return event?.args.dealId;
}

export async function retryDealId(readDealId: () => Promise<bigint>, attempts = 4, delayMs = 500): Promise<bigint> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const dealId = await readDealId();
    if (dealId) return dealId;
    if (attempt < attempts - 1 && delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return 0n;
}

export function createCeloRepository(provider?: InjectedProvider, account = ""): HandoffRepository {
  const address = publicEnv.celoContractAddress as Address;
  const token = publicEnv.celoUsdtAddress as Address;
  const wallet = provider ? createWalletClient({ account: account as Address || undefined, chain: celoChain, transport: custom(provider) }) : null;
  const read = <T>(functionName: string, args: readonly unknown[] = []) => publicClient.readContract({ address, abi: handoffCeloAbi, functionName: functionName as never, args: args as never }) as Promise<T>;
  const send = async (target: Address, abi: typeof handoffCeloAbi | typeof erc20Abi, functionName: string, args: readonly unknown[], step: TransactionStep, index: number, total: number, observer?: TransactionObserver): Promise<{ summary: TransactionReceiptSummary; receipt: TransactionReceipt }> => {
    if (!wallet || !account) throw new Error("Connect a Celo wallet first.");
    observer?.({ phase: "awaiting-signature", step, stepIndex: index, totalSteps: total, message: step === "reset-approval" ? "Approve clearing the old USDT allowance." : step === "approval" ? "Approve the exact USDT amount." : "Approve the Handoff action." });
    const hash = await wallet.writeContract({ address: target, abi, functionName: functionName as never, args: args as never, account: account as Address, chain: celoChain } as never);
    const explorerUrl = `${getCeloExplorer()}/tx/${hash}`;
    observer?.({ phase: "confirming", step, stepIndex: index, totalSteps: total, message: `Step ${index} of ${total} submitted. Waiting for Celo.`, hash, explorerUrl });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    observer?.({ phase: "confirmed", step, stepIndex: index, totalSteps: total, message: `Step ${index} of ${total} confirmed.`, hash, explorerUrl });
    return { summary: { hash, explorerUrl, step }, receipt };
  };
  const action = async (name: string, args: readonly unknown[], observer?: TransactionObserver) => {
    try { return { transactions: [(await send(address, handoffCeloAbi, name, args, "action", 1, 1, observer)).summary] }; } catch (error) { throw friendlyContractError(error); }
  };
  return {
    network: "celo", configured: contractConfigured("celo"), assetSymbol: "USDT", assetDecimals: 6, maxAmount: 50_000_000n,
    async getDeal(id) { try { return mapCeloDeal(await read("getDeal", [id])); } catch (error) { if (String(error).includes("DealNotFound")) return null; throw friendlyContractError(error); } },
    getDealIdByRef: (dealRef) => read("getDealIdByRef", [dealRef as Hex]),
    async getActorActivity(owner) { return mapActivity(await read("getActorActivity", [owner as Address])); },
    getCreatedCount: (owner) => read("getCreatedCount", [owner as Address]), getFundedCount: (owner) => read("getFundedCount", [owner as Address]),
    getCreatedIds: (owner, start, count) => Promise.all(Array.from({ length: count }, (_, i) => read<bigint>("getCreatedId", [owner as Address, start + BigInt(i)]))),
    getFundedIds: (owner, start, count) => Promise.all(Array.from({ length: count }, (_, i) => read<bigint>("getFundedId", [owner as Address, start + BigInt(i)]))),
    getAssetBalance: (owner) => publicClient.readContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [owner as Address] }),
    async createDeal(input, observer) {
      try {
        const dealRef = input.dealRef as Hex;
        const { summary, receipt } = await send(address, handoffCeloAbi, "createDeal", [dealRef, input.termsHash as Hex, input.amount, BigInt(input.expiresAt), (input.intendedBuyer || ZERO) as Address], "action", 1, 1, observer);
        const dealId = dealIdFromCreatedLogs(receipt.logs, dealRef)
          ?? await retryDealId(() => read<bigint>("getDealIdByRef", [dealRef]));
        return { transactions: [summary], dealId };
      } catch (error) { throw friendlyContractError(error); }
    },
    async fundDeal(input, observer) {
      if (!wallet || !account) throw new Error("Connect a Celo wallet first.");
      try {
        const [balance, allowance] = await Promise.all([
          publicClient.readContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [account as Address] }),
          publicClient.readContract({ address: token, abi: erc20Abi, functionName: "allowance", args: [account as Address, address] })
        ]);
        const deal = await this.getDeal(input.dealId); if (!deal) throw new Error("DealNotFound");
        if (balance < deal.amount) throw new Error("This wallet does not have enough USDT for this deal.");
        const steps = approvalSteps(allowance, deal.amount).length; const transactions: TransactionReceiptSummary[] = []; let index = 1;
        if (allowance !== 0n && allowance !== deal.amount) transactions.push((await send(token, erc20Abi, "approve", [address, 0n], "reset-approval", index++, steps, observer)).summary);
        if (allowance !== deal.amount) transactions.push((await send(token, erc20Abi, "approve", [address, deal.amount], "approval", index++, steps, observer)).summary);
        transactions.push((await send(address, handoffCeloAbi, "fundDeal", [input.dealId, input.releaseCommitment as Hex], "action", index, steps, observer)).summary);
        return { transactions };
      } catch (error) { throw friendlyContractError(error); }
    },
    confirmHandoff: (id, observer) => action("confirmHandoff", [id], observer), claimHandoff: (id, secret, observer) => action("claimHandoff", [id, secret as Hex], observer),
    refundDeal: (id, observer) => action("refundDeal", [id], observer), refundExpired: (id, observer) => action("refundExpired", [id], observer), cancelDeal: (id, observer) => action("cancelDeal", [id], observer)
  };
}
