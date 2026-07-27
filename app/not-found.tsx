import type { Metadata } from "next";
import Link from "next/link";
import { PackageX } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested Handoff page is unavailable. Check that the full link was copied, then open a dashboard or return home.",
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
          This link does not open a valid Handoff screen. The most common cause
          is a shortened or partially copied URL.
        </p>
        <p>
          When a private deal sheet is attached, the part after the{" "}
          <code>#</code> symbol must stay intact. Some chat apps and manual
          copy steps drop that fragment, which breaks the attached deal sheet.
          The private deal sheet lives only in the link itself and is never
          sent with the page request.
        </p>
        <p>
          Ask the sender to resend the full link. If it cannot be recovered,
          ask for the portable <code>.handoff.json</code> deal sheet and import
          it from a dashboard instead.
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
