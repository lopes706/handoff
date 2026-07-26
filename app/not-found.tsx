import type { Metadata } from "next";
import Link from "next/link";
import { PackageX } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested Handoff page is unavailable. Open a dashboard or return to the home page.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="invalid-page" id="main-content" tabIndex={-1}>
      <section className="invalid-card">
        <PackageX aria-hidden="true" size={42} />
        <span className="eyebrow">Page not found · 404</span>
        <h1>This Handoff page could not be found.</h1>
        <p>
          This link does not open a valid Handoff screen. Ask the sender to
          resend the full URL, including everything after the{" "}
          <span className="mono">#</span> when a private deal sheet is
          attached. The private deal sheet stays only in the link and is never
          sent with the page request.
        </p>
        <div className="button-row">
          <Link className="button primary" href="/">
            Return to home page
          </Link>
          <Link className="button" href="/app/celo">
            Open Celo dashboard
          </Link>
          <Link className="button" href="/app/stacks">
            Open Stacks dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
