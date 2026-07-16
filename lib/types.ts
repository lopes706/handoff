export type Network = "celo" | "stacks";
export type DealStatus = "open" | "funded" | "completed" | "refunded" | "cancelled";
export type DealResolution = "none" | "buyer-confirmed" | "seller-claimed" | "seller-refunded" | "expired-refund";

export type HandoffDeal = {
  id: bigint;
  network: Network;
  dealRef: string;
  seller: string;
  intendedBuyer: string | null;
  buyer: string | null;
  termsHash: string;
  releaseCommitment: string;
  amount: bigint;
  createdAt: number;
  expiresAt: number;
  fundedAt: number | null;
  resolvedAt: number | null;
  status: DealStatus;
  resolution: DealResolution;
};

export type ActorActivity = {
  dealsCreated: bigint;
  dealsFunded: bigint;
  completedAsSeller: bigint;
  completedAsBuyer: bigint;
  refundedAsBuyer: bigint;
  refundsIssuedAsSeller: bigint;
};

export type DealTermsV1 = {
  version: 1;
  dealRef: string;
  title: string;
  description: string;
  meetingHint: string;
};

export type DealSheetV1 = {
  version: 1;
  network: Network;
  networkId: string;
  contractId: string;
  dealId: string;
  dealRef: string;
  terms: DealTermsV1;
  termsHash: string;
  createdAt: number;
  checksum: string;
};

export type ReleaseTicketV1 = {
  version: 1;
  network: Network;
  networkId: string;
  contractId: string;
  dealId: string;
  dealRef: string;
  buyer: string;
  secret: string;
  commitment: string;
  fundTransactionId: string | null;
  createdAt: number;
  checksum: string;
};

export type TransactionPhase = "idle" | "awaiting-signature" | "submitted" | "confirming" | "confirmed" | "rejected" | "failed";
export type TransactionStep = "reset-approval" | "approval" | "action";
export type TransactionState = {
  phase: TransactionPhase;
  message: string;
  step?: TransactionStep;
  stepIndex?: number;
  totalSteps?: number;
  hash?: string;
  explorerUrl?: string;
};
export type TransactionObserver = (state: TransactionState) => void;
export type TransactionReceiptSummary = { hash: string; explorerUrl: string; step: TransactionStep };
export type TransactionResult = { transactions: TransactionReceiptSummary[]; dealId?: bigint };

export type CreateDealInput = { dealRef: string; termsHash: string; amount: bigint; expiresAt: number; intendedBuyer: string | null };
export type FundDealInput = { dealId: bigint; releaseCommitment: string };

export interface HandoffRepository {
  readonly network: Network;
  readonly configured: boolean;
  readonly assetSymbol: "USDT" | "sBTC";
  readonly assetDecimals: number;
  readonly maxAmount: bigint;
  getDeal(id: bigint): Promise<HandoffDeal | null>;
  getDealIdByRef(dealRef: string): Promise<bigint>;
  getActorActivity(address: string): Promise<ActorActivity>;
  getCreatedCount(address: string): Promise<bigint>;
  getFundedCount(address: string): Promise<bigint>;
  getCreatedIds(address: string, start: bigint, count: number): Promise<bigint[]>;
  getFundedIds(address: string, start: bigint, count: number): Promise<bigint[]>;
  getAssetBalance(address: string): Promise<bigint>;
  createDeal(input: CreateDealInput, observer?: TransactionObserver): Promise<TransactionResult>;
  fundDeal(input: FundDealInput, observer?: TransactionObserver): Promise<TransactionResult>;
  confirmHandoff(id: bigint, observer?: TransactionObserver): Promise<TransactionResult>;
  claimHandoff(id: bigint, releaseSecret: string, observer?: TransactionObserver): Promise<TransactionResult>;
  refundDeal(id: bigint, observer?: TransactionObserver): Promise<TransactionResult>;
  refundExpired(id: bigint, observer?: TransactionObserver): Promise<TransactionResult>;
  cancelDeal(id: bigint, observer?: TransactionObserver): Promise<TransactionResult>;
}
