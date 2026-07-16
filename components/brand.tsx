import Link from "next/link";
import { PackageCheck } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link className="brand" href="/" aria-label="Handoff home"><span className="brand-mark"><PackageCheck aria-hidden="true" /></span><span>HANDOFF{!compact && <small>inspect · exchange · release</small>}</span></Link>;
}
