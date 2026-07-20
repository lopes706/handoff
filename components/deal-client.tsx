"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clipboard,
  Download,
  ExternalLink,
  FileInput,
  LockKeyhole,
  PackageCheck,
  RefreshCcw,
  ShieldAlert,
  TimerReset,
  Wallet,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ReleaseScanner } from "./release-scanner";
import { useNetworkClient } from "./network-client";
import { contractExplorerUrl, contractId } from "@/lib/env";
import {
  effectiveStatus,
  formatAsset,
  formatDuration,
  shortAddress,
} from "@/lib/format";
import {
  buildReleaseTicket,
  dealSheetFilename,
  decodeDealSheetFragment,
  makeReleaseQrPayload,
  parseDealSheet,
  parseReleaseQrPayload,
  parseReleaseTicket,
  randomHex32,
  sha256HexBytes,
  ticketFilename,
} from "@/lib/portable";
import { privateVault } from "@/lib/vault";
import type {
  DealSheetV1,
  HandoffDeal,
  Network,
  ReleaseTicketV1,
  TransactionState,
} from "@/lib/types";

function download(name: string, value: unknown) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob(
      [typeof value === "string" ? value : JSON.stringify(value, null, 2)],
      { type: "application/json" },
    ),
  );
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}
const previewTerms = {
  version: 1 as const,
  dealRef: `0x${"42".repeat(32)}`,
  title: "Restored touring bicycle",
  description:
    "Steel frame, recently serviced. Inspect the drivetrain, brakes and serial number before release.",
  meetingHint: "South entrance, beside the staffed ticket office.",
};
function previewDeal(network: Network, id: bigint, phase: string): HandoffDeal {
  const now = Math.floor(Date.now() / 1000);
  const status = (
    ["open", "funded", "completed", "refunded", "cancelled"].includes(phase)
      ? phase
      : "funded"
  ) as HandoffDeal["status"];
  return {
    id,
    network,
    dealRef: previewTerms.dealRef,
    seller:
      network === "celo"
        ? "0x2B3B31A5Efb5D8835A5cE90d3a148F315F09c76A"
        : "SP2S65SHP3KMW3WZQ3QS5K0VQ3M9T9Z1C5XP8D2Q",
    intendedBuyer: null,
    buyer:
      network === "celo"
        ? "0x8C09A4C530e731B72dF9908b175CC59854BC3a31"
        : "SP3FBR2AGK9RZ4KPWVK1XQ4VDN5Q4J8C3T8Y1M1F",
    termsHash: `0x${"aa".repeat(32)}`,
    releaseCommitment: `0x${"bb".repeat(32)}`,
    amount: network === "celo" ? 18_500_000n : 42_000n,
    createdAt: now - 900,
    expiresAt: now + 7200,
    fundedAt: status === "open" ? null : now - 600,
    resolvedAt: ["completed", "refunded", "cancelled"].includes(status)
      ? now - 60
      : null,
    status,
    resolution:
      status === "completed"
        ? "buyer-confirmed"
        : status === "refunded"
          ? "seller-refunded"
          : "none",
  };
}

export function DealClient({ network, id }: { network: Network; id: string }) {
  const client = useNetworkClient(network);
  const numericId = BigInt(id);
  const [deal, setDeal] = useState<HandoffDeal | null>();
  const [sheet, setSheet] = useState<DealSheetV1>();
  const [sheetError, setSheetError] = useState("");
  const [ticket, setTicket] = useState<ReleaseTicketV1>();
  const [transaction, setTransaction] = useState<TransactionState>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [qrPayload, setQrPayload] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [manualPass, setManualPass] = useState("");
  const [scannedSecret, setScannedSecret] = useState("");
  const sheetFile = useRef<HTMLInputElement>(null);
  const ticketFile = useRef<HTMLInputElement>(null);
  const passFile = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [clock, setClock] = useState(() => Math.floor(Date.now() / 1000));
  const load = useCallback(async () => {
    setError("");
    const query =
      new URLSearchParams(window.location.search).get("preview") || "";
    setPreview(query);
    if (query) {
      const localDeal = previewDeal(network, numericId, query.split("-")[0]);
      setDeal(localDeal);
      setSheet({
        version: 1,
        network,
        networkId: "local-preview",
        contractId: "local-preview",
        dealId: id,
        dealRef: previewTerms.dealRef,
        terms: previewTerms,
        termsHash: `0x${"aa".repeat(32)}`,
        createdAt: Math.floor(Date.now() / 1000),
        checksum: `0x${"cc".repeat(32)}`,
      });
      if (query.includes("buyer")) {
        const secret = `0x${"11".repeat(32)}`;
        setTicket(
          await buildReleaseTicket({
            network,
            dealId: id,
            dealRef: localDeal.dealRef,
            buyer: localDeal.buyer!,
            secret,
            commitment: await sha256HexBytes(secret),
            fundTransactionId: "local-preview",
          }),
        );
      }
      return;
    }
    if (!client.repository.configured) {
      setDeal(undefined);
      return;
    }
    const onchain = await client.repository.getDeal(numericId);
    setDeal(onchain);
    if (!onchain) return;
    try {
      let raw = "";
      if (window.location.hash.startsWith("#sheet="))
        raw = decodeDealSheetFragment(window.location.hash);
      else {
        const saved = await privateVault.getSheet(
          network,
          contractId(network),
          id,
        );
        if (saved) raw = JSON.stringify(saved);
      }
      if (!raw) {
        setSheetError(
          "The private deal sheet is missing. Import the .handoff.json file to verify terms before funding.",
        );
        return;
      }
      const parsed = await parseDealSheet(raw, {
        network,
        contractId: contractId(network),
        dealId: id,
      });
      if (
        parsed.dealRef.toLowerCase() !== onchain.dealRef.toLowerCase() ||
        parsed.termsHash.toLowerCase() !== onchain.termsHash.toLowerCase()
      )
        throw new Error(
          "The deal sheet does not match the onchain reference and terms fingerprint.",
        );
      setSheet(parsed);
      setSheetError("");
      await privateVault.putSheet(parsed);
    } catch (reason) {
      setSheetError(
        reason instanceof Error
          ? reason.message
          : "The private deal sheet is invalid.",
      );
    }
  }, [client.repository, id, network, numericId]);
  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        void load().catch((reason) =>
          setError(
            reason instanceof Error
              ? reason.message
              : "The deal could not be loaded.",
          ),
        ),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (!deal?.buyer || !client.account || preview) return;
    void privateVault
      .getTicket(network, contractId(network), id, client.account)
      .then(setTicket)
      .catch(() => undefined);
  }, [client.account, deal?.buyer, id, network, preview]);
  useEffect(() => {
    if (
      !ticket ||
      preview ||
      !deal ||
      !["completed", "refunded", "cancelled"].includes(deal.status)
    )
      return;
    let cancelled = false;
    void privateVault
      .archiveTicket(ticket, "observed-terminal-settlement")
      .then(() => privateVault.removeTicket(ticket))
      .then(() => !cancelled && setTicket(undefined))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [deal, preview, ticket]);
  useEffect(() => {
    const timer = window.setInterval(
      () => setClock(Math.floor(Date.now() / 1000)),
      30_000,
    );
    return () => window.clearInterval(timer);
  }, []);
  const status = deal ? effectiveStatus(deal) : "open";
  const isSeller = Boolean(
    preview.includes("seller") ||
    (deal &&
      client.account &&
      deal.seller.toLowerCase() === client.account.toLowerCase()),
  );
  const isBuyer = Boolean(
    preview.includes("buyer") ||
    (deal &&
      client.account &&
      deal.buyer?.toLowerCase() === client.account.toLowerCase()),
  );
  const verified = Boolean(sheet && !sheetError);
  const fundingOpen = Boolean(
    deal && deal.status === "open" && clock + 300 <= deal.expiresAt,
  );
  const amount = deal
    ? formatAsset(
        deal.amount,
        client.repository.assetDecimals,
        client.repository.assetSymbol,
      )
    : "";
  async function run(
    action: () => Promise<{ transactions: Array<{ hash: string }> }>,
    terminal = false,
  ) {
    setBusy(true);
    setError("");
    try {
      if (preview) {
        setTransaction({
          phase: "confirmed",
          message:
            "Local preview updated. No wallet or network action occurred.",
        });
        if (deal)
          setDeal({ ...deal, status: terminal ? "completed" : deal.status });
        return;
      }
      const result = await action();
      if (terminal && ticket) {
        await privateVault.archiveTicket(
          ticket,
          result.transactions.at(-1)?.hash || "",
        );
        await privateVault.removeTicket(ticket);
        setTicket(undefined);
      }
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The action could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function fund() {
    if (!deal || !sheet) return;
    setBusy(true);
    setError("");
    try {
      if (preview) {
        setDeal({
          ...deal,
          status: "funded",
          buyer: deal.buyer || "LOCAL_PREVIEW_BUYER",
          fundedAt: Math.floor(Date.now() / 1000),
        });
        setTransaction({
          phase: "confirmed",
          message:
            "Local preview funded. No wallet or network action occurred.",
        });
        return;
      }
      if (!client.connected) {
        await client.connect();
        return;
      }
      const secret = randomHex32();
      const commitment = await sha256HexBytes(secret);
      const pending = await buildReleaseTicket({
        network,
        dealId: id,
        dealRef: deal.dealRef,
        buyer: client.account,
        secret,
        commitment,
        fundTransactionId: null,
      });
      await privateVault.putTicket(pending);
      setTicket(pending);
      const result = await client.repository.fundDeal(
        { dealId: numericId, releaseCommitment: commitment },
        setTransaction,
      );
      const funded = await buildReleaseTicket({
        network,
        dealId: id,
        dealRef: deal.dealRef,
        buyer: client.account,
        secret,
        commitment,
        fundTransactionId: result.transactions.at(-1)?.hash || null,
      });
      await privateVault.putTicket(funded);
      setTicket(funded);
      await load();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Funding did not complete. Your pending release ticket remains available for retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function acceptPass(raw: string) {
    try {
      if (preview) {
        setScannedSecret(`0x${"11".repeat(32)}`);
        setManualPass(raw);
        return;
      }
      const parsed = await parseReleaseQrPayload(raw, {
        network,
        contractId: contractId(network),
        dealId: id,
      });
      setScannedSecret(parsed.secret);
      setManualPass(raw);
      setShowScanner(false);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The release pass is invalid.",
      );
    }
  }
  async function showReleasePass() {
    if (!ticket) return;
    try {
      setQrPayload(await makeReleaseQrPayload(ticket));
      setShowPass(true);
      setError("");
    } catch {
      setError("The release pass could not be prepared.");
    }
  }
  async function importSheet(file?: File) {
    if (!file || !deal) return;
    try {
      const parsed = await parseDealSheet(
        await file.text(),
        preview
          ? undefined
          : { network, contractId: contractId(network), dealId: id },
      );
      if (
        parsed.dealRef.toLowerCase() !== deal.dealRef.toLowerCase() ||
        parsed.termsHash.toLowerCase() !== deal.termsHash.toLowerCase()
      )
        throw new Error("The imported sheet does not match this deal.");
      setSheet(parsed);
      setSheetError("");
      if (!preview) await privateVault.putSheet(parsed);
    } catch (reason) {
      setSheetError(
        reason instanceof Error ? reason.message : "The file is invalid.",
      );
    }
  }
  async function importTicket(file?: File) {
    if (!file) return;
    try {
      const parsed = await parseReleaseTicket(
        await file.text(),
        preview
          ? undefined
          : {
              network,
              contractId: contractId(network),
              dealId: id,
              buyer: client.account,
            },
      );
      setTicket(parsed);
      if (!preview) await privateVault.putTicket(parsed);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The ticket file is invalid.",
      );
    }
  }
  if (deal === undefined)
    return (
      <main className="app-main">
        <div className="setup">
          <AlertTriangle aria-hidden="true" />
          <div>
            <h3>Contract setup required</h3>
            <p>
              This build cannot read deal #{id} because the {network} contract
              identifier is missing. No sample data has been substituted.
            </p>
            <Link
              className="button"
              href={`/d/${network}/${id}?preview=funded`}
            >
              Open local deal preview
            </Link>
          </div>
        </div>
      </main>
    );
  if (deal === null)
    return (
      <main className="app-main">
        <div className="invalid-card">
          <h1>Unknown deal.</h1>
          <p>
            No deal #{id} was found on the selected {network} contract.
          </p>
          <Link className="button primary" href={`/app/${network}`}>
            Return to deals
          </Link>
        </div>
      </main>
    );
  if (!deal)
    return (
      <main className="app-main">
        <p>Reading the contract and private sheet…</p>
      </main>
    );
  const terminal = ["completed", "refunded", "cancelled"].includes(deal.status);
  return (
    <main className="app-main">
      {preview && <div className="preview-ribbon">LOCAL PREVIEW</div>}
      <div className="app-heading">
        <div>
          <span className={`tag ${network}`}>
            {network === "celo" ? "Celo · USDT" : "Stacks · sBTC"}
          </span>
          <h1>Deal #{id.padStart(4, "0")}</h1>
        </div>
        <div className="wallet-line">
          {client.connected ? (
            <span className="wallet-chip">{shortAddress(client.account)}</span>
          ) : (
            <button className="button" onClick={() => client.connect()}>
              <Wallet size={18} /> Connect wallet
            </button>
          )}
        </div>
      </div>
      <div className="deal-layout">
        <section className="deal-label">
          <div className="deal-label-head">
            <span className="eyebrow">Unlisted handoff deal</span>
            <span className="status-tape">{status}</span>
          </div>
          <div className="deal-label-body">
            <div className="barcode" aria-hidden="true" />
            {sheet ? (
              <>
                <h2 className="deal-title">{sheet.terms.title}</h2>
                {sheet.terms.description && <p>{sheet.terms.description}</p>}
                {sheet.terms.meetingHint && (
                  <div className="privacy-note">
                    <strong>Meeting hint</strong>
                    <br />
                    {sheet.terms.meetingHint}
                  </div>
                )}
                <p className="fineprint">
                  <CheckCircle2 size={16} style={{ verticalAlign: "middle" }} />{" "}
                  Private sheet checksum and onchain terms fingerprint match.
                </p>
              </>
            ) : (
              <>
                <h2 className="deal-title">Private terms unavailable</h2>
                <p>
                  The onchain deal exists, but the human-readable sheet did not
                  arrive with this URL.
                </p>
              </>
            )}{" "}
            {sheetError && (
              <div className="warning" role="alert">
                <ShieldAlert aria-hidden="true" />
                {sheetError}
              </div>
            )}
            <input
              ref={sheetFile}
              className="sr-only"
              type="file"
              aria-label="Import deal sheet file"
              accept=".json,.handoff.json,application/json"
              onChange={(e) => importSheet(e.target.files?.[0])}
            />
            <button
              className="button"
              onClick={() => sheetFile.current?.click()}
            >
              <FileInput size={17} /> Import deal sheet
            </button>
            <div className="fact-grid">
              <div className="fact">
                <span>Exact amount</span>
                <strong className="amount">{amount}</strong>
              </div>
              <div className="fact">
                <span>Remaining</span>
                <strong>
                  {formatDuration(Math.max(0, deal.expiresAt - clock))}
                </strong>
              </div>
              <div className="fact">
                <span>Seller</span>
                <strong className="mono">{shortAddress(deal.seller, 7)}</strong>
              </div>
              <div className="fact">
                <span>Buyer</span>
                <strong className="mono">
                  {deal.buyer
                    ? shortAddress(deal.buyer, 7)
                    : deal.intendedBuyer
                      ? `Only ${shortAddress(deal.intendedBuyer, 7)}`
                      : "First valid funder"}
                </strong>
              </div>
              <div className="fact">
                <span>Terms hash</span>
                <strong className="mono">
                  {shortAddress(deal.termsHash, 8)}
                </strong>
              </div>
              <div className="fact">
                <span>Contract</span>
                <a
                  href={contractExplorerUrl(network)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <strong>
                    Inspect onchain <ExternalLink size={14} />
                  </strong>
                </a>
              </div>
            </div>
            {sheet && (
              <div className="button-row">
                <button
                  className="button"
                  onClick={() =>
                    navigator.clipboard.writeText(window.location.href)
                  }
                >
                  <Clipboard size={17} /> Copy private link
                </button>
                <button
                  className="button"
                  onClick={() => download(dealSheetFilename(sheet), sheet)}
                >
                  <Download size={17} /> Back up sheet
                </button>
              </div>
            )}
          </div>
        </section>
        <aside className="inspection" aria-live="polite">
          {status === "open" && (
            <div className="action-panel orange-top">
              <span className="eyebrow">Inspection stop / open</span>
              <h3>
                {isSeller
                  ? "Share and back up this deal"
                  : "Verify before locking payment"}
              </h3>
              {isSeller ? (
                <>
                  <p>
                    Send the complete URL, including its private fragment, to
                    the buyer. Export a second copy before leaving this screen.
                  </p>
                  <button
                    className="button danger"
                    disabled={busy}
                    onClick={() =>
                      run(() =>
                        client.repository.cancelDeal(numericId, setTransaction),
                      )
                    }
                  >
                    Cancel unfunded deal
                  </button>
                </>
              ) : (
                <>
                  <div className="warning">
                    <LockKeyhole />
                    {network === "celo"
                      ? "Celo may ask for an exact USDT approval, then a separate funding confirmation."
                      : "Stacks uses one call with an exact-deny sBTC post-condition."}
                  </div>
                  <p>
                    Funding creates a private release secret in this browser.
                    Export the ticket if you may switch devices.
                  </p>
                  <button
                    className="button primary"
                    disabled={busy || !verified || !fundingOpen}
                    onClick={fund}
                  >
                    {busy
                      ? "Preparing funding…"
                      : fundingOpen
                        ? `Lock ${amount}`
                        : "Funding window closed"}
                  </button>
                </>
              )}
            </div>
          )}
          {status === "funded" && isBuyer && (
            <div className="action-panel green-top">
              <span className="eyebrow">Buyer controls release</span>
              <h3>Inspect the item first</h3>
              <div className="warning">
                <AlertTriangle aria-hidden="true" />
                Releasing pays the seller immediately and cannot be reversed.
              </div>
              {ticket ? (
                <>
                  <button
                    className="button primary"
                    disabled={busy}
                    onClick={() => void showReleasePass()}
                  >
                    <PackageCheck size={18} /> Show one-time release pass
                  </button>
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () =>
                          client.repository.confirmHandoff(
                            numericId,
                            setTransaction,
                          ),
                        true,
                      )
                    }
                  >
                    Confirm directly in wallet
                  </button>
                  <button
                    className="button ghost"
                    onClick={() => download(ticketFilename(ticket), ticket)}
                  >
                    <Download size={17} /> Back up release ticket
                  </button>
                </>
              ) : (
                <>
                  <p>
                    This browser does not have the release ticket. Import the
                    buyer’s backup to display the QR.
                  </p>
                  <input
                    ref={ticketFile}
                    className="sr-only"
                    type="file"
                    aria-label="Import release ticket file"
                    accept=".json,application/json"
                    onChange={(e) => importTicket(e.target.files?.[0])}
                  />
                  <button
                    className="button"
                    onClick={() => ticketFile.current?.click()}
                  >
                    <FileInput size={17} /> Import ticket
                  </button>
                  <button
                    className="button primary"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () =>
                          client.repository.confirmHandoff(
                            numericId,
                            setTransaction,
                          ),
                        true,
                      )
                    }
                  >
                    Confirm directly instead
                  </button>
                </>
              )}
            </div>
          )}
          {status === "funded" && isSeller && (
            <div className="action-panel orange-top">
              <span className="eyebrow">Seller station</span>
              <h3>Scan only after handover</h3>
              <p>
                The pass is checked against this network, contract, deal
                reference and buyer commitment before submission.
              </p>
              <button
                className="button primary"
                onClick={() => setShowScanner(true)}
              >
                <Camera size={18} /> Scan release pass
              </button>
              <label
                className="field-label"
                htmlFor="manual-pass"
                style={{ marginTop: 18 }}
              >
                Or paste pass JSON
              </label>
              <textarea
                id="manual-pass"
                value={manualPass}
                onChange={(e) => setManualPass(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 100,
                  border: "2px solid var(--ink)",
                }}
              />
              <button className="button" onClick={() => acceptPass(manualPass)}>
                Validate pasted pass
              </button>
              <input
                ref={passFile}
                className="sr-only"
                type="file"
                aria-label="Import release pass file"
                accept=".json,application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void file.text().then((value) => acceptPass(value));
                }}
              />
              <button
                className="button"
                onClick={() => passFile.current?.click()}
              >
                <FileInput size={17} /> Import release pass file
              </button>
              {scannedSecret && (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () =>
                        client.repository.claimHandoff(
                          numericId,
                          scannedSecret,
                          setTransaction,
                        ),
                      true,
                    )
                  }
                >
                  Claim after handoff
                </button>
              )}
              <hr className="receipt-divider" />
              <button
                className="button danger"
                disabled={busy}
                onClick={() =>
                  run(
                    () =>
                      client.repository.refundDeal(numericId, setTransaction),
                    true,
                  )
                }
              >
                Refund buyer now
              </button>
            </div>
          )}
          {status === "funded" && !isBuyer && !isSeller && (
            <div className="action-panel">
              <h3>Escrow funded</h3>
              <p>
                Only the buyer can confirm directly. Only the recorded seller
                can redeem the release pass or issue an early refund.
              </p>
            </div>
          )}
          {status === "expired" && (
            <div className="action-panel orange-top">
              <TimerReset />
              <h3>Expiry reached</h3>
              <p>
                Anyone may trigger this transaction. The exact principal always
                returns to the recorded buyer.
              </p>
              <button
                className="button primary"
                disabled={busy}
                onClick={() =>
                  run(
                    () =>
                      client.repository.refundExpired(
                        numericId,
                        setTransaction,
                      ),
                    true,
                  )
                }
              >
                Return funds to buyer
              </button>
            </div>
          )}
          {terminal && (
            <div className="action-panel green-top">
              <span className="stamped">
                {deal.status === "completed"
                  ? "HANDOFF COMPLETE"
                  : deal.status === "refunded"
                    ? "REFUNDED"
                    : "CANCELLED"}
              </span>
              <h3 style={{ marginTop: 24 }}>Terminal receipt</h3>
              <p>This deal cannot transition again.</p>
              <dl>
                <dt>Settlement method</dt>
                <dd>{deal.resolution.replaceAll("-", " ")}</dd>
                <dt>Seller</dt>
                <dd className="mono">{shortAddress(deal.seller, 7)}</dd>
                <dt>Buyer</dt>
                <dd className="mono">
                  {deal.buyer ? shortAddress(deal.buyer, 7) : "Not funded"}
                </dd>
                <dt>Principal</dt>
                <dd className="amount">{amount}</dd>
              </dl>
            </div>
          )}
          {transaction && (
            <div className="transaction-box" role="status">
              <strong>{transaction.message}</strong>
              {transaction.explorerUrl && (
                <a
                  href={transaction.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View transaction <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}
          {error && (
            <div className="warning" role="alert">
              <AlertTriangle />
              {error}
              <button
                className="button ghost"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X />
              </button>
            </div>
          )}
          <button className="button ghost" onClick={() => load()}>
            <RefreshCcw size={16} /> Refresh from contract
          </button>
        </aside>
      </div>
      {!terminal && (
        <div className="bottom-dock" aria-label="Primary mobile action">
          {status === "open" && !isSeller && (
            <button
              className="button primary"
              disabled={busy || !verified || !fundingOpen}
              onClick={fund}
            >
              {fundingOpen ? `Lock ${amount}` : "Funding window closed"}
            </button>
          )}
          {status === "funded" && isBuyer && ticket && (
            <button
              className="button primary"
              onClick={() => void showReleasePass()}
            >
              Show release pass
            </button>
          )}
          {status === "funded" && isSeller && (
            <button
              className="button primary"
              onClick={() => setShowScanner(true)}
            >
              Scan release pass
            </button>
          )}
          {status === "expired" && (
            <button
              className="button primary"
              disabled={busy}
              onClick={() =>
                run(
                  () =>
                    client.repository.refundExpired(numericId, setTransaction),
                  true,
                )
              }
            >
              Return funds to buyer
            </button>
          )}
        </div>
      )}
      {showPass && ticket && (
        <div
          className="qr-screen"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pass-title"
        >
          <div className="qr-card">
            <span className="eyebrow">Buyer release pass · deal #{id}</span>
            <h2 id="pass-title">Show only after receiving the item.</h2>
            <p>
              The seller can use this once to release {amount}. Do not send it
              ahead of the meeting.
            </p>
            <div className="qr-box">
              <QRCodeSVG value={qrPayload} size={260} level="M" />
            </div>
            <button className="button" onClick={() => setShowPass(false)}>
              <X size={18} /> Hide pass
            </button>
          </div>
        </div>
      )}
      {showScanner && (
        <div className="qr-screen" role="dialog" aria-modal="true">
          <div className="qr-card">
            <span className="eyebrow">Seller scanner · deal #{id}</span>
            <h2>Frame the buyer’s pass.</h2>
            <ReleaseScanner onRead={(value) => void acceptPass(value)} />
            <button className="button" onClick={() => setShowScanner(false)}>
              <X size={18} /> Close scanner
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
