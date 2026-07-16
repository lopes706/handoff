import { contractConfigured, getStacksApi, publicEnv, txExplorerUrl } from "../env";
import { resolutionByCode, statusByCode } from "../format";
import type { ActorActivity, HandoffDeal, HandoffRepository, TransactionObserver, TransactionResult } from "../types";
import { friendlyContractError } from "./errors";

type ClarityJson = { type?: string; value?: unknown; data?: unknown };
const contract = () => ({ address: publicEnv.stacksContractAddress, name: publicEnv.stacksContractName });
function unwrap(value: unknown): unknown { const item = value as ClarityJson; const type = item?.type?.toLowerCase() || ""; if ((type.includes("response") || type.includes("optional") || type === "ok" || type === "some") && !type.includes("err") && "value" in item) return unwrap(item.value); return value; }
function scalar(value: unknown): unknown { const item = unwrap(value) as ClarityJson; return item && typeof item === "object" && "value" in item ? scalar(item.value) : item; }
function asBigInt(value: unknown) { return BigInt(String(scalar(value) ?? 0)); }
function asString(value: unknown) { const item = scalar(value); return typeof item === "string" ? item : ""; }
function optionalPrincipal(value: unknown) { const item = value as ClarityJson; if (item?.type?.toLowerCase().includes("none") || item?.value === null) return null; return asString(value) || null; }
function tuple(value: unknown) { const item = unwrap(value) as ClarityJson; const result = item?.value ?? item?.data ?? item; return result && typeof result === "object" ? result as Record<string, unknown> : null; }

async function readOnly(functionName: string, args: unknown[], sender: string, target = contract()) {
  const { fetchCallReadOnlyFunction, cvToJSON } = await import("@stacks/transactions");
  const response = await fetchCallReadOnlyFunction({ contractAddress: target.address, contractName: target.name, functionName, functionArgs: args as never, senderAddress: sender || target.address || "ST000000000000000000002AMW42H", network: publicEnv.stacksNetwork });
  return cvToJSON(response);
}
export function mapStacksDeal(value: unknown, id: bigint): HandoffDeal | null {
  const d = tuple(value); if (!d) return null;
  return { id, network: "stacks", dealRef: `0x${asString(d["deal-ref"]).replace(/^0x/, "")}`, seller: asString(d.seller), intendedBuyer: optionalPrincipal(d["intended-buyer"]), buyer: optionalPrincipal(d.buyer), termsHash: `0x${asString(d["terms-hash"]).replace(/^0x/, "")}`, releaseCommitment: `0x${asString(d["release-commitment"]).replace(/^0x/, "")}`, amount: asBigInt(d.amount), createdAt: Number(asBigInt(d["created-at"])), expiresAt: Number(asBigInt(d["expires-at"])), fundedAt: Number(asBigInt(d["funded-at"])) || null, resolvedAt: Number(asBigInt(d["resolved-at"])) || null, status: statusByCode[Number(asBigInt(d.status))] || "open", resolution: resolutionByCode[Number(asBigInt(d.resolution))] || "none" };
}
function mapActivity(value: unknown): ActorActivity { const a = tuple(value) || {}; return { dealsCreated: asBigInt(a["deals-created"]), dealsFunded: asBigInt(a["deals-funded"]), completedAsSeller: asBigInt(a["completed-as-seller"]), completedAsBuyer: asBigInt(a["completed-as-buyer"]), refundedAsBuyer: asBigInt(a["refunded-as-buyer"]), refundsIssuedAsSeller: asBigInt(a["refunds-issued-as-seller"]) }; }
export async function exactSbtcPostConditions(account: string, amount: bigint) { const { Pc } = await import("@stacks/transactions"); return [Pc.principal(account as never).willSendEq(amount).ft(publicEnv.stacksSbtcContractId as never, "sbtc-token")]; }

export function createStacksRepository(account = ""): HandoffRepository {
  const waitForConfirmation = async (hash: string) => {
    for (let attempt = 0; attempt < 90; attempt++) { const response = await fetch(`${getStacksApi()}/extended/v1/tx/${hash}`); if (response.ok) { const result = await response.json() as { tx_status?: string }; if (result.tx_status === "success") return; if (result.tx_status?.startsWith("abort") || result.tx_status?.startsWith("dropped")) throw new Error(`Stacks transaction ended with ${result.tx_status}.`); } await new Promise((resolve) => window.setTimeout(resolve, 2000)); }
    throw new Error("The Stacks transaction is still pending. Refresh after it confirms.");
  };
  const call = async (functionName: string, functionArgs: unknown[], observer?: TransactionObserver, fundAmount?: bigint): Promise<TransactionResult> => {
    if (!account) throw new Error("Connect a Stacks wallet first.");
    const { request } = await import("@stacks/connect");
    observer?.({ phase: "awaiting-signature", step: "action", stepIndex: 1, totalSteps: 1, message: "Approve the Handoff action in your Stacks wallet." });
    try {
      const postConditions = fundAmount === undefined ? undefined : await exactSbtcPostConditions(account, fundAmount);
      const response = await request("stx_callContract", { contract: `${contract().address}.${contract().name}` as `${string}.${string}`, functionName, functionArgs: functionArgs as never, network: publicEnv.stacksNetwork, postConditionMode: "deny", postConditions } as never);
      const hash = response.txid || ""; if (!hash) throw new Error("The wallet did not return a transaction ID."); const explorerUrl = txExplorerUrl("stacks", hash);
      observer?.({ phase: "confirming", step: "action", stepIndex: 1, totalSteps: 1, message: "Submitted. Waiting for Stacks confirmation.", hash, explorerUrl });
      await waitForConfirmation(hash); observer?.({ phase: "confirmed", step: "action", stepIndex: 1, totalSteps: 1, message: "Confirmed on Stacks.", hash, explorerUrl });
      return { transactions: [{ hash, explorerUrl, step: "action" }] };
    } catch (error) { throw friendlyContractError(error); }
  };
  const sender = () => account || contract().address;
  return {
    network: "stacks", configured: contractConfigured("stacks"), assetSymbol: "sBTC", assetDecimals: 8, maxAmount: 50_000n,
    async getDeal(id) { const { Cl } = await import("@stacks/transactions"); try { return mapStacksDeal(await readOnly("get-deal", [Cl.uint(id)], sender()), id); } catch { return null; } },
    async getDealIdByRef(ref) { const { Cl } = await import("@stacks/transactions"); return asBigInt(await readOnly("get-deal-id-by-ref", [Cl.bufferFromHex(ref.replace(/^0x/, ""))], sender())); },
    async getActorActivity(owner) { const { Cl } = await import("@stacks/transactions"); return mapActivity(await readOnly("get-actor-activity", [Cl.principal(owner)], owner)); },
    async getCreatedCount(owner) { const { Cl } = await import("@stacks/transactions"); return asBigInt(await readOnly("get-created-count", [Cl.principal(owner)], owner)); },
    async getFundedCount(owner) { const { Cl } = await import("@stacks/transactions"); return asBigInt(await readOnly("get-funded-count", [Cl.principal(owner)], owner)); },
    async getCreatedIds(owner, start, count) { const { Cl } = await import("@stacks/transactions"); return Promise.all(Array.from({ length: count }, (_, i) => readOnly("get-created-id", [Cl.principal(owner), Cl.uint(start + BigInt(i))], owner).then(asBigInt))); },
    async getFundedIds(owner, start, count) { const { Cl } = await import("@stacks/transactions"); return Promise.all(Array.from({ length: count }, (_, i) => readOnly("get-funded-id", [Cl.principal(owner), Cl.uint(start + BigInt(i))], owner).then(asBigInt))); },
    async getAssetBalance(owner) { const { Cl } = await import("@stacks/transactions"); const [address, name] = publicEnv.stacksSbtcContractId.split("."); return asBigInt(await readOnly("get-balance", [Cl.principal(owner)], owner, { address, name })); },
    async createDeal(input, observer) { const { Cl } = await import("@stacks/transactions"); const result = await call("create-deal", [Cl.bufferFromHex(input.dealRef.replace(/^0x/, "")), Cl.bufferFromHex(input.termsHash.replace(/^0x/, "")), Cl.uint(input.amount), Cl.uint(input.expiresAt), input.intendedBuyer ? Cl.some(Cl.principal(input.intendedBuyer)) : Cl.none()], observer); return { ...result, dealId: await this.getDealIdByRef(input.dealRef) }; },
    async fundDeal(input, observer) { const { Cl } = await import("@stacks/transactions"); const deal = await this.getDeal(input.dealId); if (!deal) throw new Error("This deal does not exist."); return call("fund-deal", [Cl.uint(input.dealId), Cl.bufferFromHex(input.releaseCommitment.replace(/^0x/, ""))], observer, deal.amount); },
    async confirmHandoff(id, observer) { const { Cl } = await import("@stacks/transactions"); return call("confirm-handoff", [Cl.uint(id)], observer); },
    async claimHandoff(id, secret, observer) { const { Cl } = await import("@stacks/transactions"); return call("claim-handoff", [Cl.uint(id), Cl.bufferFromHex(secret.replace(/^0x/, ""))], observer); },
    async refundDeal(id, observer) { const { Cl } = await import("@stacks/transactions"); return call("refund-deal", [Cl.uint(id)], observer); },
    async refundExpired(id, observer) { const { Cl } = await import("@stacks/transactions"); return call("refund-expired", [Cl.uint(id)], observer); },
    async cancelDeal(id, observer) { const { Cl } = await import("@stacks/transactions"); return call("cancel-deal", [Cl.uint(id)], observer); }
  };
}
export const stacksParsing = { unwrap, asBigInt, asString, optionalPrincipal, tuple, mapStacksDeal, mapActivity };
