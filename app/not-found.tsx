import type { Metadata } from "next";
import Link from "next/link";
import { PackageX } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested Handoff page is unavailable. Open the app or return to the home page.",
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
          resend the full URL, including the{" "}
          <span className="mono">#sheet=</span> fragment when a private deal
          sheet is attached. That private deal sheet stays only in the link and
          is never sent with the page request.
        </p>
        <div className="button-row">
          <Link className="button" href="/app/celo">
            Open Celo app
          </Link>
          <Link className="button" href="/app/stacks">
            Open Stacks app
          </Link>
          <Link className="button primary" href="/">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
