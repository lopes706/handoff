import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppFrame } from "@/components/app-frame";
import { DealClient } from "@/components/deal-client";
import { isNetwork, networkLabel } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ network: string; id: string }> }): Promise<Metadata> {
  const { network } = await params;
  return {
    title: isNetwork(network) ? `${networkLabel(network)} private deal` : "Private deal",
    robots: { index: false, follow: false },
    referrer: "no-referrer"
  };
}

export default async function DealPage({ params }: { params: Promise<{ network: string; id: string }> }) { const { network, id } = await params; if (!isNetwork(network) || !/^\d+$/.test(id) || BigInt(id) === 0n) notFound(); return <AppFrame network={network}><DealClient network={network} id={id} /></AppFrame>; }
