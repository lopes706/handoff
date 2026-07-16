const dealComponents = [
  { name: "id", type: "uint256" }, { name: "dealRef", type: "bytes32" },
  { name: "seller", type: "address" }, { name: "intendedBuyer", type: "address" }, { name: "buyer", type: "address" },
  { name: "termsHash", type: "bytes32" }, { name: "releaseCommitment", type: "bytes32" },
  { name: "amount", type: "uint64" }, { name: "createdAt", type: "uint64" }, { name: "expiresAt", type: "uint64" },
  { name: "fundedAt", type: "uint64" }, { name: "resolvedAt", type: "uint64" },
  { name: "status", type: "uint8" }, { name: "resolution", type: "uint8" }
] as const;

const activityComponents = [
  { name: "dealsCreated", type: "uint256" }, { name: "dealsFunded", type: "uint256" },
  { name: "completedAsSeller", type: "uint256" }, { name: "completedAsBuyer", type: "uint256" },
  { name: "refundedAsBuyer", type: "uint256" }, { name: "refundsIssuedAsSeller", type: "uint256" }
] as const;

export const handoffCeloAbi = [
  { type: "function", name: "getDeal", stateMutability: "view", inputs: [{ name: "dealId", type: "uint256" }], outputs: [{ name: "", type: "tuple", components: dealComponents }] },
  { type: "function", name: "getDealIdByRef", stateMutability: "view", inputs: [{ name: "dealRef", type: "bytes32" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "getActorActivity", stateMutability: "view", inputs: [{ name: "actor", type: "address" }], outputs: [{ name: "", type: "tuple", components: activityComponents }] },
  ...["getCreatedCount", "getFundedCount"].map((name) => ({ type: "function", name, stateMutability: "view", inputs: [{ name: "actor", type: "address" }], outputs: [{ name: "", type: "uint256" }] } as const)),
  ...["getCreatedId", "getFundedId"].map((name) => ({ type: "function", name, stateMutability: "view", inputs: [{ name: "actor", type: "address" }, { name: "index", type: "uint256" }], outputs: [{ name: "", type: "uint256" }] } as const)),
  { type: "function", name: "createDeal", stateMutability: "nonpayable", inputs: [{ name: "dealRef", type: "bytes32" }, { name: "termsHash", type: "bytes32" }, { name: "amount", type: "uint64" }, { name: "expiresAt", type: "uint64" }, { name: "intendedBuyer", type: "address" }], outputs: [{ name: "dealId", type: "uint256" }] },
  { type: "function", name: "fundDeal", stateMutability: "nonpayable", inputs: [{ name: "dealId", type: "uint256" }, { name: "releaseCommitment", type: "bytes32" }], outputs: [] },
  { type: "function", name: "confirmHandoff", stateMutability: "nonpayable", inputs: [{ name: "dealId", type: "uint256" }], outputs: [] },
  { type: "function", name: "claimHandoff", stateMutability: "nonpayable", inputs: [{ name: "dealId", type: "uint256" }, { name: "releaseSecret", type: "bytes32" }], outputs: [] },
  { type: "function", name: "refundDeal", stateMutability: "nonpayable", inputs: [{ name: "dealId", type: "uint256" }], outputs: [] },
  { type: "function", name: "refundExpired", stateMutability: "nonpayable", inputs: [{ name: "dealId", type: "uint256" }], outputs: [] },
  { type: "function", name: "cancelDeal", stateMutability: "nonpayable", inputs: [{ name: "dealId", type: "uint256" }], outputs: [] }
] as const;

export const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] }
] as const;
