import { webcrypto } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { buildReleaseTicket, sha256HexBytes } from "@/lib/portable";
import { privateVault } from "@/lib/vault";
beforeAll(()=>{Object.defineProperty(globalThis,"crypto",{value:webcrypto,configurable:true});});
describe("private IndexedDB vault",()=>{it("keeps a pending ticket for retry, then removes its secret after archival",async()=>{const secret=`0x${"56".repeat(32)}`;const ticket=await buildReleaseTicket({network:"celo",dealId:"77",dealRef:`0x${"78".repeat(32)}`,buyer:"0x0000000000000000000000000000000000000001",secret,commitment:await sha256HexBytes(secret),fundTransactionId:null});await privateVault.putTicket(ticket);expect((await privateVault.getTicket(ticket.network,ticket.contractId,ticket.dealId,ticket.buyer))?.secret).toBe(secret);await privateVault.archiveTicket(ticket,"0xsettled");await privateVault.removeTicket(ticket);expect(await privateVault.getTicket(ticket.network,ticket.contractId,ticket.dealId,ticket.buyer)).toBeUndefined();});});
