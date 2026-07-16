import { createHash, webcrypto } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  buildDealSheet,
  buildReleaseTicket,
  canonicalTerms,
  decodeDealSheetFragment,
  encodeDealSheetFragment,
  makeReleaseQrPayload,
  makeTermsHash,
  normalizeTerms,
  parseDealSheet,
  parseReleaseQrPayload,
  parseReleaseTicket,
  sha256HexBytes,
} from "@/lib/portable";
beforeAll(() => {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
});
const ref = `0x${"12".repeat(32)}`;
const secret = `0x${"34".repeat(32)}`;
describe("portable Handoff data", () => {
  it("normalizes Unicode to NFC and hashes fixed-key JSON", async () => {
    const terms = normalizeTerms({
      dealRef: ref,
      title: "  Cafe\u0301 camera  ",
      description: "  Good condition ",
      meetingHint: " Lobby ",
    });
    expect(terms.title).toBe("Café camera");
    const independent = `0x${createHash("sha256").update(canonicalTerms(terms)).digest("hex")}`;
    expect(await makeTermsHash(terms)).toBe(independent);
    expect(() =>
      normalizeTerms({ dealRef: ref, title: "bad\u0001title" }),
    ).toThrow(/control/);
  });
  it("round-trips a sheet through a URL fragment and rejects tampering", async () => {
    const terms = normalizeTerms({ dealRef: ref, title: "Field camera" });
    const termsHash = await makeTermsHash(terms);
    const sheet = await buildDealSheet({
      network: "celo",
      dealId: "7",
      terms,
      termsHash,
    });
    const decoded = decodeDealSheetFragment(
      `#${encodeDealSheetFragment(sheet)}`,
    );
    expect((await parseDealSheet(decoded)).terms.title).toBe("Field camera");
    const changed = JSON.parse(decoded);
    changed.terms.title = "Different";
    await expect(parseDealSheet(JSON.stringify(changed))).rejects.toThrow(
      /changed/,
    );
    await expect(parseDealSheet(decoded, { dealId: "8" })).rejects.toThrow(
      /different dealId/,
    );
  });
  it("checks ticket secret, checksum, deployment, QR, and failed-funding null hash", async () => {
    const commitment = await sha256HexBytes(secret);
    const ticket = await buildReleaseTicket({
      network: "stacks",
      dealId: "9",
      dealRef: ref,
      buyer: "ST23P0KCY3SS64KXEWTYRAA8P385CFKHK4QHD30GZ",
      secret,
      commitment,
      fundTransactionId: null,
    });
    expect(
      (await parseReleaseTicket(JSON.stringify(ticket))).fundTransactionId,
    ).toBeNull();
    const qr = await makeReleaseQrPayload(ticket);
    expect(
      (
        await parseReleaseQrPayload(qr, {
          network: "stacks",
          contractId: ticket.contractId,
          dealId: "9",
        })
      ).secret,
    ).toBe(secret);
    await expect(
      parseReleaseQrPayload(qr, {
        network: "stacks",
        contractId: "wrong.contract",
        dealId: "9",
      }),
    ).rejects.toThrow(/different contractId/);
    const changed = { ...ticket, secret: ref };
    await expect(parseReleaseTicket(JSON.stringify(changed))).rejects.toThrow(
      /commitment/,
    );
  });
});
