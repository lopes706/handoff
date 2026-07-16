"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, PackageOpen, Wallet } from "lucide-react";
import { useNetworkClient } from "./network-client";
import { formatAsset, shortAddress } from "@/lib/format";
import type { ActorActivity, HandoffDeal, Network } from "@/lib/types";

const emptyActivity: ActorActivity = {
  dealsCreated: 0n,
  dealsFunded: 0n,
  completedAsSeller: 0n,
  completedAsBuyer: 0n,
  refundedAsBuyer: 0n,
  refundsIssuedAsSeller: 0n,
};
const previewActivity: ActorActivity = {
  dealsCreated: 3n,
  dealsFunded: 2n,
  completedAsSeller: 1n,
  completedAsBuyer: 1n,
  refundedAsBuyer: 0n,
  refundsIssuedAsSeller: 1n,
};
function previewDeals(network: Network): HandoffDeal[] {
  const now = Math.floor(Date.now() / 1000);
  const seller =
    network === "celo"
      ? "0x2B3B31A5Efb5D8835A5cE90d3a148F315F09c76A"
      : "SP2S65SHP3KMW3WZQ3QS5K0VQ3M9T9Z1C5XP8D2Q";
  const buyer =
    network === "celo"
      ? "0x8C09A4C530e731B72dF9908b175CC59854BC3a31"
      : "SP3FBR2AGK9RZ4KPWVK1XQ4VDN5Q4J8C3T8Y1M1F";
  return [
    {
      id: 42n,
      network,
      dealRef: `0x${"42".repeat(32)}`,
      seller,
      intendedBuyer: null,
      buyer,
      termsHash: `0x${"aa".repeat(32)}`,
      releaseCommitment: `0x${"bb".repeat(32)}`,
      amount: network === "celo" ? 18_500_000n : 42_000n,
      createdAt: now - 1800,
      expiresAt: now + 7200,
      fundedAt: now - 1200,
      resolvedAt: null,
      status: "funded",
      resolution: "none",
    },
    {
      id: 41n,
      network,
      dealRef: `0x${"41".repeat(32)}`,
      seller,
      intendedBuyer: null,
      buyer: null,
      termsHash: `0x${"ab".repeat(32)}`,
      releaseCommitment: `0x${"00".repeat(32)}`,
      amount: network === "celo" ? 7_250_000n : 18_000n,
      createdAt: now - 2400,
      expiresAt: now + 8400,
      fundedAt: null,
      resolvedAt: null,
      status: "open",
      resolution: "none",
    },
    {
      id: 39n,
      network,
      dealRef: `0x${"39".repeat(32)}`,
      seller,
      intendedBuyer: null,
      buyer,
      termsHash: `0x${"ac".repeat(32)}`,
      releaseCommitment: `0x${"bc".repeat(32)}`,
      amount: network === "celo" ? 32_000_000n : 50_000n,
      createdAt: now - 9000,
      expiresAt: now - 1800,
      fundedAt: now - 8400,
      resolvedAt: now - 3600,
      status: "completed",
      resolution: "buyer-confirmed",
    },
  ];
}
export function DashboardClient({
  network,
  preview = false,
}: {
  network: Network;
  preview?: boolean;
}) {
  const client = useNetworkClient(network);
  const [deals, setDeals] = useState<HandoffDeal[]>([]);
  const [activity, setActivity] = useState(emptyActivity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!client.connected || !client.repository.configured) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void Promise.all([
        client.repository.getCreatedCount(client.account),
        client.repository.getFundedCount(client.account),
        client.repository.getActorActivity(client.account),
      ])
        .then(async ([created, funded, nextActivity]) => {
          const createdTake = Math.min(10, Number(created));
          const fundedTake = Math.min(10, Number(funded));
          const [a, b] = await Promise.all([
            client.repository.getCreatedIds(
              client.account,
              created - BigInt(createdTake),
              createdTake,
            ),
            client.repository.getFundedIds(
              client.account,
              funded - BigInt(fundedTake),
              fundedTake,
            ),
          ]);
          const ids = [...new Set([...a, ...b].map(String))]
            .map(BigInt)
            .sort((x, y) => (x > y ? -1 : 1));
          const rows = (
            await Promise.all(ids.map((id) => client.repository.getDeal(id)))
          ).filter(Boolean) as HandoffDeal[];
          if (!cancelled) {
            setDeals(rows);
            setActivity(nextActivity);
          }
        })
        .catch(
          (reason) =>
            !cancelled &&
            setError(
              reason instanceof Error
                ? reason.message
                : "Could not load the manifest.",
            ),
        )
        .finally(() => !cancelled && setLoading(false));
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [client.account, client.connected, client.repository]);
  return (
    <main className="app-main">
      {preview && <div className="preview-ribbon">LOCAL PREVIEW</div>}
      <div className="app-heading">
        <div>
          <span className={`tag ${network}`}>
            {network === "celo" ? "Celo · USDT" : "Stacks · sBTC"}
          </span>
          <h1>Your manifest</h1>
          <p>
            {preview
              ? "Labelled sample manifest for interface inspection only."
              : "Created and funded deals read directly from the contract."}
          </p>
        </div>
        <div className="wallet-line">
          {preview ? (
            <span className="wallet-chip">NO LIVE WALLET</span>
          ) : client.connected ? (
            <>
              <span className="wallet-chip">
                {shortAddress(client.account)}
              </span>
              <button
                className="button ghost"
                onClick={() => client.disconnect()}
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              className="button primary"
              onClick={() => client.connect()}
              disabled={client.connecting}
            >
              <Wallet size={18} />{" "}
              {client.connecting
                ? "Connecting…"
                : network === "celo"
                  ? "Connect wallet"
                  : "Connect Stacks"}
            </button>
          )}
        </div>
      </div>
      {!client.repository.configured && !preview ? (
        <div className="setup" role="status">
          <AlertTriangle aria-hidden="true" />
          <div>
            <h3>Contract setup required</h3>
            <p>
              No Handoff contract address is configured for this build. Add the
              public deployment variables from{" "}
              <span className="mono">.env.example</span>; Handoff will never
              substitute demo deals for live contract state.
            </p>
            <Link className="button" href={`/d/${network}/42?preview=funded`}>
              Open labelled UI preview
            </Link>
          </div>
        </div>
      ) : !client.connected && !preview ? (
        <div className="manifest">
          <div className="empty">
            <PackageOpen size={42} />
            <h3>Connect to inspect your manifest</h3>
            <p>
              Wallet addresses are used only for direct contract reads. There is
              no account database.
            </p>
          </div>
        </div>
      ) : (
        <div className="dashboard-grid">
          <section className="manifest" aria-busy={preview ? false : loading}>
            <div className="manifest-head">
              <strong>Recent dispatches</strong>
              <span className="mono">
                {(preview ? previewDeals(network) : deals).length
                  .toString()
                  .padStart(2, "0")}
              </span>
            </div>
            <div className="manifest-body">
              {!preview && error && <p role="alert">{error}</p>}
              {!preview && loading ? (
                <p>Reading contract indexes…</p>
              ) : (preview ? previewDeals(network) : deals).length ? (
                (preview ? previewDeals(network) : deals).map((deal) => (
                  <Link
                    className="deal-row"
                    href={
                      preview
                        ? `/d/${network}/${deal.id}?preview=${deal.status}`
                        : `/d/${network}/${deal.id}`
                    }
                    key={deal.id.toString()}
                  >
                    <span className="mono">
                      #{deal.id.toString().padStart(4, "0")}
                    </span>
                    <span>
                      <strong>{deal.status.toUpperCase()}</strong>
                      <small style={{ display: "block" }}>
                        {shortAddress(deal.seller)} →{" "}
                        {deal.buyer
                          ? shortAddress(deal.buyer)
                          : "waiting for buyer"}
                      </small>
                    </span>
                    <span className="amount">
                      {formatAsset(
                        deal.amount,
                        client.repository.assetDecimals,
                        client.repository.assetSymbol,
                      )}{" "}
                      <ArrowRight size={15} />
                    </span>
                  </Link>
                ))
              ) : (
                <div className="empty">
                  <h3>No dispatches yet</h3>
                  <p>
                    Create an unlisted label and share it directly with your
                    buyer.
                  </p>
                  <Link className="button primary" href={`/app/${network}/new`}>
                    Create first handoff
                  </Link>
                </div>
              )}
            </div>
          </section>
          <aside>
            <h3>Activity, not reputation</h3>
            <p className="fineprint">
              These raw counts describe onchain actions. They are not a trust
              score or endorsement.
            </p>
            <div className="activity-grid">
              {Object.entries(preview ? previewActivity : activity).map(
                ([key, value]) => (
                  <div className="activity-cell" key={key}>
                    <strong>{value.toString()}</strong>
                    <small>
                      {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </small>
                  </div>
                ),
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
