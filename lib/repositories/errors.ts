const messages: Record<string, string> = {
  InvalidDealReference: "The deal reference is invalid.", DuplicateDealReference: "This deal reference already exists.",
  InvalidTermsHash: "The terms fingerprint is invalid.", InvalidAmount: "The amount is outside Handoff’s limit.",
  InvalidExpiry: "Choose an expiry between 5 minutes and 30 days.", InvalidBuyer: "The seller cannot be the buyer.",
  DealNotFound: "This deal does not exist.", InvalidStatus: "This deal has already moved to another phase.",
  Unauthorized: "This wallet is not allowed to do that.", FundingWindowClosed: "Funding closes when fewer than 5 minutes remain.",
  InvalidCommitment: "The release pass commitment is invalid.", InvalidSecret: "This release pass does not match the buyer’s commitment.",
  DealExpired: "This deal has expired and can only be refunded.", DealNotExpired: "The deal has not expired yet.",
  UnsupportedTokenBehavior: "USDT did not transfer the exact amount. Nothing was changed.", IndexOutOfBounds: "That history entry does not exist.",
  TransferFailed: "The asset transfer failed. Nothing was changed."
};
const clarityCodes: Record<string, string> = {
  u400: "InvalidDealReference", u401: "DuplicateDealReference", u402: "InvalidTermsHash", u403: "InvalidAmount",
  u404: "InvalidExpiry", u405: "InvalidBuyer", u406: "DealNotFound", u407: "InvalidStatus", u408: "Unauthorized",
  u409: "FundingWindowClosed", u410: "InvalidCommitment", u411: "InvalidSecret", u412: "DealExpired",
  u413: "DealNotExpired", u414: "IndexOutOfBounds", u415: "TransferFailed"
};

export function friendlyContractError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  if (/reject|denied|cancelled by user|user rejected/i.test(raw)) return new Error("Transaction rejected in the wallet. Your deal is unchanged.");
  if (/insufficient funds|exceeds balance/i.test(raw)) return new Error("This wallet does not have enough balance for the amount and network fee.");
  const name = Object.keys(messages).find((item) => raw.includes(item)) || Object.entries(clarityCodes).find(([code]) => new RegExp(`\\b${code}\\b`).test(raw))?.[1];
  return new Error(name ? messages[name] : "The network could not complete that action. Check the selected network and try again.");
}
