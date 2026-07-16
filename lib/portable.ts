import { contractId, networkId } from "./env";
import type {
  DealSheetV1,
  DealTermsV1,
  Network,
  ReleaseTicketV1,
} from "./types";

const ZERO_32 = `0x${"0".repeat(64)}`;
const HEX_32 = /^0x[0-9a-fA-F]{64}$/;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export function randomHex32() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function sha256HexBytes(hex: string) {
  if (!HEX_32.test(hex)) throw new Error("Expected a 32-byte value.");
  const bytes = Uint8Array.from(hex.slice(2).match(/.{2}/g)!, (value) =>
    Number.parseInt(value, 16),
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `0x${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

async function sha256Text(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return `0x${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function clean(value: string, max: number, label: string, required = false) {
  const normalized = value.normalize("NFC").trim();
  if (CONTROL.test(normalized))
    throw new Error(`${label} contains unsupported control characters.`);
  if (required && !normalized) throw new Error(`${label} is required.`);
  if ([...normalized].length > max)
    throw new Error(`${label} must be ${max} characters or fewer.`);
  return normalized;
}

export function normalizeTerms(input: {
  dealRef: string;
  title: string;
  description?: string;
  meetingHint?: string;
}): DealTermsV1 {
  if (!HEX_32.test(input.dealRef) || input.dealRef.toLowerCase() === ZERO_32)
    throw new Error("Deal reference is invalid.");
  return {
    version: 1,
    dealRef: input.dealRef.toLowerCase(),
    title: clean(input.title, 80, "Title", true),
    description: clean(input.description || "", 280, "Description"),
    meetingHint: clean(input.meetingHint || "", 120, "Meeting hint"),
  };
}

export function canonicalTerms(terms: DealTermsV1) {
  return JSON.stringify({
    version: 1,
    dealRef: terms.dealRef,
    title: terms.title,
    description: terms.description,
    meetingHint: terms.meetingHint,
  });
}
export const makeTermsHash = (terms: DealTermsV1) =>
  sha256Text(canonicalTerms(terms));

export async function buildDealSheet(input: {
  network: Network;
  dealId: string;
  terms: DealTermsV1;
  termsHash: string;
  createdAt?: number;
}): Promise<DealSheetV1> {
  const base = {
    version: 1 as const,
    network: input.network,
    networkId: networkId(input.network),
    contractId: contractId(input.network),
    dealId: input.dealId,
    dealRef: input.terms.dealRef,
    terms: input.terms,
    termsHash: input.termsHash,
    createdAt: input.createdAt ?? Math.floor(Date.now() / 1000),
  };
  return { ...base, checksum: await sha256Text(JSON.stringify(base)) };
}

export async function parseDealSheet(
  raw: string,
  expected?: Partial<
    Pick<DealSheetV1, "network" | "networkId" | "contractId" | "dealId">
  >,
) {
  const parsed = JSON.parse(raw) as DealSheetV1;
  if (
    parsed.version !== 1 ||
    !["celo", "stacks"].includes(parsed.network) ||
    !/^\d+$/.test(parsed.dealId) ||
    !HEX_32.test(parsed.termsHash)
  )
    throw new Error("This deal sheet is not valid.");
  const terms = normalizeTerms(parsed.terms);
  if (terms.dealRef.toLowerCase() !== parsed.dealRef.toLowerCase())
    throw new Error("Deal sheet reference mismatch.");
  if (
    (await makeTermsHash(terms)).toLowerCase() !==
    parsed.termsHash.toLowerCase()
  )
    throw new Error("Deal sheet terms were changed.");
  const { checksum, ...base } = parsed;
  if (
    checksum.toLowerCase() !==
    (await sha256Text(JSON.stringify(base))).toLowerCase()
  )
    throw new Error("This deal sheet was changed or corrupted.");
  for (const key of ["network", "networkId", "contractId", "dealId"] as const) {
    const wanted = expected?.[key];
    if (
      wanted &&
      String(parsed[key]).toLowerCase() !== String(wanted).toLowerCase()
    )
      throw new Error(`This deal sheet belongs to a different ${key}.`);
  }
  return { ...parsed, terms };
}

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function fromBase64Url(value: string) {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return new TextDecoder().decode(
    Uint8Array.from(binary, (character) => character.charCodeAt(0)),
  );
}
export const encodeDealSheetFragment = (sheet: DealSheetV1) =>
  `sheet=${toBase64Url(JSON.stringify(sheet))}`;
export const decodeDealSheetFragment = (fragment: string) =>
  fromBase64Url(fragment.replace(/^#?sheet=/, ""));
export const dealSheetFilename = (sheet: DealSheetV1) =>
  `handoff-${sheet.network}-deal-${sheet.dealId}.handoff.json`;

export async function buildReleaseTicket(
  input: Omit<
    ReleaseTicketV1,
    "version" | "networkId" | "contractId" | "createdAt" | "checksum"
  >,
): Promise<ReleaseTicketV1> {
  const base = {
    version: 1 as const,
    network: input.network,
    networkId: networkId(input.network),
    contractId: contractId(input.network),
    dealId: input.dealId,
    dealRef: input.dealRef,
    buyer: input.buyer,
    secret: input.secret,
    commitment: input.commitment,
    fundTransactionId: input.fundTransactionId,
    createdAt: Math.floor(Date.now() / 1000),
  };
  return { ...base, checksum: await sha256Text(JSON.stringify(base)) };
}

export async function parseReleaseTicket(
  raw: string,
  expected?: Partial<
    Pick<ReleaseTicketV1, "network" | "contractId" | "dealId" | "buyer">
  >,
) {
  const parsed = JSON.parse(raw) as ReleaseTicketV1;
  if (
    parsed.version !== 1 ||
    !["celo", "stacks"].includes(parsed.network) ||
    !HEX_32.test(parsed.secret) ||
    !HEX_32.test(parsed.commitment) ||
    !HEX_32.test(parsed.dealRef)
  )
    throw new Error("This release ticket is not valid.");
  if (
    (await sha256HexBytes(parsed.secret)).toLowerCase() !==
    parsed.commitment.toLowerCase()
  )
    throw new Error("Release secret does not match its commitment.");
  const { checksum, ...base } = parsed;
  if (
    checksum.toLowerCase() !==
    (await sha256Text(JSON.stringify(base))).toLowerCase()
  )
    throw new Error("This release ticket was changed or corrupted.");
  for (const key of ["network", "contractId", "dealId", "buyer"] as const) {
    const wanted = expected?.[key];
    if (
      wanted &&
      String(parsed[key]).toLowerCase() !== String(wanted).toLowerCase()
    )
      throw new Error(`This ticket belongs to a different ${key}.`);
  }
  return parsed;
}

export const ticketFilename = (ticket: ReleaseTicketV1) =>
  `handoff-${ticket.network}-deal-${ticket.dealId}.release.json`;
export async function makeReleaseQrPayload(ticket: ReleaseTicketV1) {
  const base = {
    version: 1 as const,
    network: ticket.network,
    contractId: ticket.contractId,
    dealId: ticket.dealId,
    secret: ticket.secret,
  };
  return JSON.stringify({
    ...base,
    checksum: await sha256Text(JSON.stringify(base)),
  });
}
export async function parseReleaseQrPayload(
  raw: string,
  expected: { network: Network; contractId: string; dealId: string },
) {
  const parsed = JSON.parse(raw) as {
    version: number;
    network: Network;
    contractId: string;
    dealId: string;
    secret: string;
    checksum: string;
  };
  if (
    parsed.version !== 1 ||
    !["celo", "stacks"].includes(parsed.network) ||
    !/^\d+$/.test(parsed.dealId) ||
    !HEX_32.test(parsed.secret) ||
    !HEX_32.test(parsed.checksum)
  ) {
    throw new Error("This release pass is not valid.");
  }
  const { checksum, ...base } = parsed;
  if (
    checksum.toLowerCase() !==
    (await sha256Text(JSON.stringify(base))).toLowerCase()
  ) {
    throw new Error("This release pass was changed or corrupted.");
  }
  for (const key of ["network", "contractId", "dealId"] as const) {
    if (
      String(parsed[key]).toLowerCase() !== String(expected[key]).toLowerCase()
    ) {
      throw new Error(`This release pass belongs to a different ${key}.`);
    }
  }
  return { secret: parsed.secret };
}
