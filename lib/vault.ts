import type { DealSheetV1, ReleaseTicketV1 } from "./types";

const DB = "handoff-private-vault";
const TICKETS = "tickets";
const SHEETS = "sheets";
const HISTORY = "history";
const key = (network: string, contract: string, deal: string, wallet = "") => `${network}:${contract}:${deal}:${wallet}`.toLowerCase();

function openVault() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(TICKETS)) request.result.createObjectStore(TICKETS);
      if (!request.result.objectStoreNames.contains(SHEETS)) request.result.createObjectStore(SHEETS);
      if (!request.result.objectStoreNames.contains(HISTORY)) request.result.createObjectStore(HISTORY);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Private browser storage is unavailable."));
  });
}

async function operation<T>(storeName: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openVault();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = run(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("The private vault could not be updated."));
    transaction.oncomplete = () => db.close();
  });
}

export const privateVault = {
  available: () => typeof indexedDB !== "undefined",
  putTicket(ticket: ReleaseTicketV1) { return operation(TICKETS, "readwrite", (store) => store.put(ticket, key(ticket.network, ticket.contractId, ticket.dealId, ticket.buyer))); },
  getTicket(network: string, contract: string, deal: string, wallet: string) { return operation<ReleaseTicketV1 | undefined>(TICKETS, "readonly", (store) => store.get(key(network, contract, deal, wallet))); },
  removeTicket(ticket: ReleaseTicketV1) { return operation(TICKETS, "readwrite", (store) => store.delete(key(ticket.network, ticket.contractId, ticket.dealId, ticket.buyer))); },
  archiveTicket(ticket: ReleaseTicketV1, settlementTransactionId: string) { return operation(HISTORY, "readwrite", (store) => store.put({ version: 1, network: ticket.network, contractId: ticket.contractId, dealId: ticket.dealId, buyer: ticket.buyer, commitment: ticket.commitment, fundTransactionId: ticket.fundTransactionId, settlementTransactionId, archivedAt: Math.floor(Date.now() / 1000) }, key(ticket.network, ticket.contractId, ticket.dealId, ticket.buyer))); },
  putSheet(sheet: DealSheetV1) { return operation(SHEETS, "readwrite", (store) => store.put(sheet, key(sheet.network, sheet.contractId, sheet.dealId))); },
  getSheet(network: string, contract: string, deal: string) { return operation<DealSheetV1 | undefined>(SHEETS, "readonly", (store) => store.get(key(network, contract, deal))); }
};
