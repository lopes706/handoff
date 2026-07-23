import Link from "next/link";
import { Brand } from "./brand";
import { networkLabel } from "@/lib/format";
import type { Network } from "@/lib/types";

export function AppFrame({
  network,
  activeNav,
  children,
}: {
  network: Network;
  activeNav?: "manifest" | "new";
  children: React.ReactNode;
}) {
  const activeNetworkLabel = networkLabel(network);
  return <div className="app-shell"><header className="app-topbar"><div className="inner"><Brand compact /><nav aria-label="App navigation" className="wallet-line"><Link aria-current={activeNav === "manifest" ? "page" : undefined} aria-label={`${activeNetworkLabel} deals`} className={activeNav === "manifest" ? "topbar-link topbar-link-active" : "topbar-link"} href={`/app/${network}`}>Deals</Link><Link aria-current={activeNav === "new" ? "page" : undefined} aria-label={`Create new ${activeNetworkLabel} deal sheet`} className={activeNav === "new" ? "button primary topbar-button-active" : "button primary"} href={`/app/${network}/new`}>New deal sheet</Link></nav></div></header><main id="main-content" tabIndex={-1}>{children}</main></div>;
}
