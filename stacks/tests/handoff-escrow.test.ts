import { beforeEach, describe, expect, it } from "vitest";
import { initSimnet, type Simnet } from "@stacks/clarinet-sdk";
import { Cl } from "@stacks/transactions";

const CONTRACT = "handoff-escrow";
const hex = (value: number) => value.toString(16).padStart(64, "0");
const buffer = (value: number) => Cl.bufferFromHex(hex(value));
const resultText = (value: { result: unknown }) => Cl.prettyPrint(value.result as never);

let simnet: Simnet;
let accounts: string[];

function now() {
  const result = simnet.callReadOnlyFn(CONTRACT, "get-chain-time", [], accounts[0]);
  return Number(resultText(result).match(/u(\d+)/)?.[1] || 0);
}

function create(sender = accounts[0], id = 1, intended?: string, amount = 5000, duration = 3600) {
  return simnet.callPublicFn(CONTRACT, "create-deal", [
    buffer(id), buffer(100 + id), Cl.uint(amount), Cl.uint(now() + duration), intended ? Cl.some(Cl.principal(intended)) : Cl.none()
  ], sender);
}

describe("handoff-escrow", () => {
  beforeEach(async () => {
    simnet = await initSimnet("./Clarinet.toml", true);
    accounts = [...simnet.getAccounts().values()];
  });

  it("creates open and named-buyer deals and indexes the seller", () => {
    expect(resultText(create(accounts[0], 1, accounts[1]))).toBe("(ok u1)");
    expect(resultText(simnet.callReadOnlyFn(CONTRACT, "get-deal-id-by-ref", [buffer(1)], accounts[0]))).toBe("(ok u1)");
    expect(resultText(simnet.callReadOnlyFn(CONTRACT, "get-created-count", [Cl.principal(accounts[0])], accounts[0]))).toBe("(ok u1)");
    const deal = resultText(simnet.callReadOnlyFn(CONTRACT, "get-deal", [Cl.uint(1)], accounts[0]));
    expect(deal).toContain("status: u0");
    expect(deal).toContain(accounts[1]);
  });

  it("rejects duplicate refs, bad values and self-targeting", () => {
    create();
    expect(resultText(create(accounts[0], 1))).toBe("(err u401)");
    expect(resultText(create(accounts[0], 2, undefined, 0))).toBe("(err u403)");
    expect(resultText(create(accounts[0], 2, undefined, 50001))).toBe("(err u403)");
    expect(resultText(create(accounts[0], 2, accounts[0]))).toBe("(err u405)");
    expect(resultText(create(accounts[0], 2, undefined, 1, 60))).toBe("(err u404)");
  });

  it("funds exact sBTC only from the intended buyer", () => {
    create(accounts[0], 1, accounts[1]);
    const commitment = Cl.bufferFromHex(hex(700));
    expect(resultText(simnet.callPublicFn(CONTRACT, "fund-deal", [Cl.uint(1), commitment], accounts[2]))).toBe("(err u408)");
    expect(resultText(simnet.callPublicFn(CONTRACT, "fund-deal", [Cl.uint(1), commitment], accounts[1]))).toBe("(ok true)");
    expect(resultText(simnet.callReadOnlyFn(CONTRACT, "get-total-liability", [], accounts[0]))).toBe("(ok u5000)");
    expect(resultText(simnet.callReadOnlyFn(CONTRACT, "get-funded-id", [Cl.principal(accounts[1]), Cl.uint(0)], accounts[1]))).toBe("(ok u1)");
  });

  it("supports buyer confirmation and blocks repeated settlement", () => {
    create();
    simnet.callPublicFn(CONTRACT, "fund-deal", [Cl.uint(1), buffer(700)], accounts[1]);
    expect(resultText(simnet.callPublicFn(CONTRACT, "confirm-handoff", [Cl.uint(1)], accounts[2]))).toBe("(err u408)");
    expect(resultText(simnet.callPublicFn(CONTRACT, "confirm-handoff", [Cl.uint(1)], accounts[1]))).toBe("(ok true)");
    expect(resultText(simnet.callPublicFn(CONTRACT, "confirm-handoff", [Cl.uint(1)], accounts[1]))).toBe("(err u407)");
    expect(resultText(simnet.callReadOnlyFn(CONTRACT, "get-total-liability", [], accounts[0]))).toBe("(ok u0)");
  });

  it("supports seller secret claim using SHA-256", async () => {
    const secretBytes = Uint8Array.from({ length: 32 }, (_, index) => index + 1);
    const digest = await crypto.subtle.digest("SHA-256", secretBytes);
    const commitment = Cl.buffer(new Uint8Array(digest));
    create();
    simnet.callPublicFn(CONTRACT, "fund-deal", [Cl.uint(1), commitment], accounts[1]);
    expect(resultText(simnet.callPublicFn(CONTRACT, "claim-handoff", [Cl.uint(1), Cl.buffer(new Uint8Array(32))], accounts[0]))).toBe("(err u411)");
    expect(resultText(simnet.callPublicFn(CONTRACT, "claim-handoff", [Cl.uint(1), Cl.buffer(secretBytes)], accounts[2]))).toBe("(err u408)");
    expect(resultText(simnet.callPublicFn(CONTRACT, "claim-handoff", [Cl.uint(1), Cl.buffer(secretBytes)], accounts[0]))).toBe("(ok true)");
  });

  it("supports seller refunds and cancellation", () => {
    create();
    simnet.callPublicFn(CONTRACT, "fund-deal", [Cl.uint(1), buffer(700)], accounts[1]);
    expect(resultText(simnet.callPublicFn(CONTRACT, "refund-deal", [Cl.uint(1)], accounts[2]))).toBe("(err u408)");
    expect(resultText(simnet.callPublicFn(CONTRACT, "refund-deal", [Cl.uint(1)], accounts[0]))).toBe("(ok true)");
    create(accounts[0], 2);
    expect(resultText(simnet.callPublicFn(CONTRACT, "cancel-deal", [Cl.uint(2)], accounts[0]))).toBe("(ok true)");
  });

  it("guards missing records and indexes", () => {
    expect(resultText(simnet.callReadOnlyFn(CONTRACT, "get-deal", [Cl.uint(99)], accounts[0]))).toBe("(err u406)");
    expect(resultText(simnet.callReadOnlyFn(CONTRACT, "get-funded-id", [Cl.principal(accounts[0]), Cl.uint(0)], accounts[0]))).toBe("(err u414)");
  });
});
