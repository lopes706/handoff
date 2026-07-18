import type { DealResolution, DealStatus, HandoffDeal, Network } from "./types";

export const isNetwork = (value: string): value is Network => value === "celo" || value === "stacks";
export const networkLabel = (network: Network) => network === "celo" ? "Celo" : "Stacks";
export const statusByCode: DealStatus[] = ["open", "funded", "completed", "refunded", "cancelled"];
export const resolutionByCode: DealResolution[] = ["none", "buyer-confirmed", "seller-claimed", "seller-refunded", "expired-refund"];
export const shortAddress = (value: string, take = 5) => value.length > take * 2 + 1 ? `${value.slice(0, take)}…${value.slice(-take)}` : value;
export const formatAsset = (amount: bigint, decimals: number, symbol: string) => {
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const fraction = (amount % base).toString().padStart(decimals, "0").replace(/0+$/, "").slice(0, symbol === "sBTC" ? 8 : 2);
  return `${whole}${fraction ? `.${fraction}` : ""} ${symbol}`;
};
export const effectiveStatus = (deal: HandoffDeal, now = Math.floor(Date.now() / 1000)): DealStatus | "expired" => deal.status === "funded" && now >= deal.expiresAt ? "expired" : deal.status;
export const secondsRemaining = (deal: HandoffDeal, now = Math.floor(Date.now() / 1000)) => Math.max(0, deal.expiresAt - now);
export const formatDuration = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};
