import { describe, expect, it } from "vitest";
import { effectiveStatus } from "@/lib/format";
import type { HandoffDeal } from "@/lib/types";
const deal=(status:HandoffDeal["status"],expiresAt=100):HandoffDeal=>({id:1n,network:"celo",dealRef:"",seller:"",intendedBuyer:null,buyer:"buyer",termsHash:"",releaseCommitment:"",amount:1n,createdAt:0,expiresAt,fundedAt:1,resolvedAt:null,status,resolution:"none"});
describe("role and expiry state",()=>{it("opens permissionless refund exactly at funded expiry",()=>{expect(effectiveStatus(deal("funded"),99)).toBe("funded");expect(effectiveStatus(deal("funded"),100)).toBe("expired");});it("does not pretend an unfunded expired label holds refundable funds",()=>{expect(effectiveStatus(deal("open"),100)).toBe("open");});it("leaves terminal states terminal",()=>{expect(effectiveStatus(deal("completed"),1000)).toBe("completed");expect(effectiveStatus(deal("refunded"),1000)).toBe("refunded");});});
