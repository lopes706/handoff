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

  if (current) {
    return (
      <span className="brand" aria-current="page">
        {content}
      </span>
    );
  }

  return (
    <Link className="brand" href="/" aria-label="Handoff home">
      {content}
    </Link>
  );
}
