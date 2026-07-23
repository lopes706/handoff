import Link from "next/link";
import { Brand } from "./brand";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Brand current />
      <nav aria-label="Primary navigation">
        <Link className="site-nav-link" href="/#how">
          How Handoff works
        </Link>
        <Link className="site-nav-link" href="/app/celo">
          Open Celo app
        </Link>
        <Link className="site-nav-link" href="/app/stacks">
          Open Stacks app
        </Link>
      </nav>
    </header>
  );
}
