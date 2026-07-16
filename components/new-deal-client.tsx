"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, FileLock2, Wallet } from "lucide-react";
import { useNetworkClient } from "./network-client";
import {
  buildDealSheet,
  encodeDealSheetFragment,
  makeTermsHash,
  normalizeTerms,
  randomHex32,
} from "@/lib/portable";
import { privateVault } from "@/lib/vault";
import type { Network, TransactionState } from "@/lib/types";

const expiries = [
  { label: "30 min", value: 1800 },
  { label: "2 hours", value: 7200 },
  { label: "24 hours", value: 86400 },
  { label: "3 days", value: 259200 },
  { label: "7 days", value: 604800 },
];
export function NewDealClient({ network }: { network: Network }) {
  const client = useNetworkClient(network);
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingHint, setMeetingHint] = useState("");
  const [duration, setDuration] = useState(86400);
  const [restricted, setRestricted] = useState(false);
  const [buyer, setBuyer] = useState("");
  const [transaction, setTransaction] = useState<TransactionState>();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const max = useMemo(
    () => (network === "celo" ? "50.00" : "0.00050000"),
    [network],
  );
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!client.connected) {
      try {
        await client.connect();
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Wallet connection failed.",
        );
      }
      return;
    }
    if (!client.repository.configured) {
      setError("Configure the Handoff contract before creating a live deal.");
      return;
    }
    setSubmitting(true);
    try {
      const parsed = Number(amount);
      if (!Number.isFinite(parsed) || parsed <= 0)
        throw new Error("Enter a positive amount.");
      const units = BigInt(
        Math.round(parsed * 10 ** client.repository.assetDecimals),
      );
      if (units > client.repository.maxAmount)
        throw new Error(
          `The v1 limit is ${max} ${client.repository.assetSymbol}.`,
        );
      const terms = normalizeTerms({
        dealRef: randomHex32(),
        title,
        description,
        meetingHint,
      });
      const termsHash = await makeTermsHash(terms);
      const expiresAt = Math.floor(Date.now() / 1000) + duration;
      const result = await client.repository.createDeal(
        {
          dealRef: terms.dealRef,
          termsHash,
          amount: units,
          expiresAt,
          intendedBuyer: restricted ? buyer.trim() : null,
        },
        setTransaction,
      );
      if (!result.dealId)
        throw new Error(
          "The confirmed deal could not be resolved by its reference.",
        );
      const sheet = await buildDealSheet({
        network,
        dealId: result.dealId.toString(),
        terms,
        termsHash,
      });
      await privateVault.putSheet(sheet);
      router.push(
        `/d/${network}/${result.dealId}#${encodeDealSheetFragment(sheet)}`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The deal could not be created.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <main className="app-main">
      <div className="app-heading">
        <div>
          <span className={`tag ${network}`}>
            {network === "celo" ? "Celo · USDT" : "Stacks · sBTC"}
          </span>
          <h1>Create label</h1>
          <p>One mobile form. One private sheet. One immutable expiry.</p>
        </div>
        {client.connected ? (
          <span className="wallet-chip">Seller wallet connected</span>
        ) : (
          <button className="button" onClick={() => client.connect()}>
            <Wallet size={18} /> Connect seller wallet
          </button>
        )}
      </div>
      <form className="form-card" onSubmit={submit}>
        <div className="form-strip">
          <strong>HANDOFF / NEW DISPATCH</strong>
          <span className="mono">V1</span>
        </div>
        <div className="form-body">
          {!client.repository.configured && (
            <div className="warning">
              <AlertTriangle />
              <span>
                This build has no live contract configured. The form remains
                visible for review, but submission is blocked.
              </span>
            </div>
          )}
          <div className="field">
            <label htmlFor="title">Item or exchange title</label>
            <input
              id="title"
              required
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vintage field camera"
            />
            <small>
              1–80 characters. Avoid sensitive personal information.
            </small>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="amount">Exact amount</label>
              <div className="amount-input">
                <input
                  id="amount"
                  required
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
                <span>{client.repository.assetSymbol}</span>
              </div>
              <small>
                Maximum {max} {client.repository.assetSymbol}
              </small>
            </div>
            <fieldset className="field" style={{ border: 0, padding: 0 }}>
              <legend className="field-label">Expiry</legend>
              <div className="choice-row">
                {expiries.map((item) => (
                  <div className="choice" key={item.value}>
                    <input
                      id={`expiry-${item.value}`}
                      type="radio"
                      name="expiry"
                      checked={duration === item.value}
                      onChange={() => setDuration(item.value)}
                    />
                    <label htmlFor={`expiry-${item.value}`}>{item.label}</label>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="field">
            <label htmlFor="description">
              Description <span className="fineprint">optional</span>
            </label>
            <textarea
              id="description"
              maxLength={280}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Condition, included parts, or what the buyer should inspect."
            />
          </div>
          <div className="field">
            <label htmlFor="meeting">
              Meeting hint <span className="fineprint">optional</span>
            </label>
            <input
              id="meeting"
              maxLength={120}
              value={meetingHint}
              onChange={(e) => setMeetingHint(e.target.value)}
              placeholder="Inside the main station entrance"
            />
          </div>
          <fieldset className="field" style={{ border: 0, padding: 0 }}>
            <legend className="field-label">Buyer access</legend>
            <div className="choice-row">
              <div className="choice">
                <input
                  id="open"
                  type="radio"
                  checked={!restricted}
                  onChange={() => setRestricted(false)}
                />
                <label htmlFor="open">First valid buyer</label>
              </div>
              <div className="choice">
                <input
                  id="named"
                  type="radio"
                  checked={restricted}
                  onChange={() => setRestricted(true)}
                />
                <label htmlFor="named">Named wallet only</label>
              </div>
            </div>
          </fieldset>
          {restricted && (
            <div className="field">
              <label htmlFor="buyer">Buyer address</label>
              <input
                id="buyer"
                required
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                placeholder={network === "celo" ? "0x…" : "SP… / ST…"}
              />
            </div>
          )}
          <div className="privacy-note">
            <FileLock2 size={20} style={{ float: "left", marginRight: 10 }} />
            <strong>Private by sharing, not encrypted.</strong> The title,
            description and meeting hint travel in the link fragment or exported
            file. Anyone holding either can read them.
          </div>
          {transaction && (
            <div className="transaction-box" role="status">
              <strong>{transaction.message}</strong>
              {transaction.hash && (
                <span
                  className="mono"
                  style={{ display: "block", overflowWrap: "anywhere" }}
                >
                  {transaction.hash}
                </span>
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="warning">
              <AlertTriangle />
              {error}
            </p>
          )}
          <button
            className="button primary"
            type="submit"
            disabled={submitting || !client.repository.configured}
          >
            {submitting ? (
              "Creating label…"
            ) : (
              <>
                Create unlisted deal <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
