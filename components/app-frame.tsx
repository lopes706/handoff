import Link from "next/link";
import { Brand } from "./brand";
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
  return <div className="app-shell"><header className="app-topbar"><div className="inner"><Brand compact /><nav aria-label="App navigation" className="wallet-line"><Link aria-current={activeNav === "manifest" ? "page" : undefined} className={activeNav === "manifest" ? "topbar-link topbar-link-active" : "topbar-link"} href={`/app/${network}`}>Manifest</Link><Link aria-current={activeNav === "new" ? "page" : undefined} className={activeNav === "new" ? "button primary topbar-button-active" : "button primary"} href={`/app/${network}/new`}>New handoff</Link></nav></div></header><main id="main-content" tabIndex={-1}>{children}</main></div>;
}
