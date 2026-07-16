import Link from "next/link";
import { Brand } from "./brand";

export function SiteHeader() { return <header className="site-header"><Brand /><nav aria-label="Primary navigation"><Link href="/#how">How it works</Link><Link href="/app">Open app</Link></nav></header>; }
