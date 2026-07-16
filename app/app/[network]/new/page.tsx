import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppFrame } from "@/components/app-frame";
import { NewDealClient } from "@/components/new-deal-client";
import { isNetwork } from "@/lib/format";
export const metadata: Metadata = { title: "Create label" };
export default async function NewDealPage({ params }: { params: Promise<{ network: string }> }) { const { network } = await params; if (!isNetwork(network)) notFound(); return <AppFrame network={network} activeNav="new"><NewDealClient network={network} /></AppFrame>; }
