import Link from "next/link";
import { PackageCheck } from "lucide-react";

export function Brand({
  compact = false,
  current = false,
}: {
  compact?: boolean;
  current?: boolean;
}) {
  const content = (
    <>
      <span className="brand-mark">
        <PackageCheck aria-hidden="true" />
      </span>
      <span>
        HANDOFF
        {!compact && <small>inspect · exchange · release</small>}
      </span>
    </>
  );

  return (
    <Link
      aria-current={current ? "page" : undefined}
      aria-label={current ? "Handoff home, current page" : "Handoff home"}
      className="brand"
      href="/"
    >
      {content}
    </Link>
  );
}
