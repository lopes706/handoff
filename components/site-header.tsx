import Link from "next/link";
import { Brand } from "./brand";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Brand current />
      <nav aria-label="Primary navigation">
        <Link className="site-nav-link" href="/#how">
          How it works
        </Link>
        <Link className="site-nav-link" href="/app">
          Open Handoff app
        </Link>
      </nav>
    </header>
  );
}
