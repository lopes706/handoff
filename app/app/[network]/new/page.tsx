import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppFrame } from "@/components/app-frame";
import { NewDealClient } from "@/components/new-deal-client";
import { isNetwork, networkLabel } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ network: string }> }): Promise<Metadata> {
  const { network } = await params;
  if (!isNetwork(network)) return { title: "Create deal sheet" };
  const label = networkLabel(network);
  const title = `Create ${label} deal sheet`;
  const description = `Prepare an unlisted private ${label} deal sheet for an in-person exchange before sharing it with the buyer.`;
  const url = `/app/${network}/new`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function NewDealPage({ params }: { params: Promise<{ network: string }> }) { const { network } = await params; if (!isNetwork(network)) notFound(); return <AppFrame network={network} activeNav="new"><NewDealClient network={network} /></AppFrame>; }
