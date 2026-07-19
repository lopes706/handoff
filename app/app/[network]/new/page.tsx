import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppFrame } from "@/components/app-frame";
import { NewDealClient } from "@/components/new-deal-client";
import { isNetwork, networkLabel } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ network: string }> }): Promise<Metadata> {
  const { network } = await params;
  if (!isNetwork(network)) return { title: "Create deal sheet" };
  return {
    title: `Create ${networkLabel(network)} deal sheet`,
    description: `Prepare a private Handoff deal sheet for an in-person exchange on ${networkLabel(network)}.`,
  };
}

export default async function NewDealPage({ params }: { params: Promise<{ network: string }> }) { const { network } = await params; if (!isNetwork(network)) notFound(); return <AppFrame network={network} activeNav="new"><NewDealClient network={network} /></AppFrame>; }
