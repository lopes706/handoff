import Link from "next/link";
import { Brand } from "./brand";
import type { Network } from "@/lib/types";

export function AppFrame({ network, children }: { network: Network; children: React.ReactNode }) { return <div className="app-shell"><header className="app-topbar"><div className="inner"><Brand compact /><nav aria-label="App navigation" className="wallet-line"><Link href={`/app/${network}`}>Manifest</Link><Link className="button primary" href={`/app/${network}/new`}>New handoff</Link></nav></div></header>{children}</div>; }
