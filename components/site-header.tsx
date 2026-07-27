import Link from "next/link";
import { Brand } from "./brand";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Brand current />
      <nav aria-label="Primary navigation">
        <a className="site-nav-link" href="#how">
          How Handoff works
        </a>
        <a className="site-nav-link" href="#safety">
          Safety boundaries
        </a>
        <Link className="site-nav-link" href="/app/celo">
          Open Celo dashboard
        </Link>
        <Link className="site-nav-link" href="/app/stacks">
          Open Stacks dashboard
        </Link>
      </nav>
    </header>
  );
}
