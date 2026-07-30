import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppFrame } from "@/components/app-frame";
import { DashboardClient } from "@/components/dashboard-client";
import { isNetwork, networkLabel } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ network: string }> }): Promise<Metadata> {
  const { network } = await params;
  if (!isNetwork(network)) return { title: "Open dashboard" };
  const label = networkLabel(network);
  const title = `${label} dashboard`;
  const description = `Inspect active, refunded, and expired Handoff deals on ${label} with the wallet that created or funded them.`;
  const url = `/app/${network}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "Handoff",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Handoff preview card" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/opengraph-image", alt: "Handoff preview card" }],
    },
  };
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ network: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { network } = await params;
  const { preview } = await searchParams;
  if (!isNetwork(network)) notFound();
  return (
    <AppFrame network={network} activeNav="manifest">
      <DashboardClient network={network} preview={preview === "1"} />
    </AppFrame>
  );
}
