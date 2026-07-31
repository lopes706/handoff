import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppFrame } from "@/components/app-frame";
import { DealClient } from "@/components/deal-client";
import { isNetwork, networkLabel } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ network: string; id: string }>;
}): Promise<Metadata> {
  const { network, id } = await params;
  const isValidId = /^\d+$/.test(id) && BigInt(id) !== 0n;
  if (!isNetwork(network) || !isValidId) {
    return {
      title: "Private deal not found",
      description:
        "The requested Handoff private deal is unavailable. Re-copy the full link, including the # fragment, or import the portable deal sheet from a dashboard.",
      robots: { index: false, follow: false },
      referrer: "no-referrer",
    };
  }
  const description =
    "Open an unlisted Handoff deal sheet for an in-person exchange. Private terms stay in the URL fragment or portable file and are never indexed.";
  const title = `${networkLabel(network)} private deal #${id}`;
  const url = `/d/${network}/${id}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    robots: { index: false, follow: false },
    referrer: "no-referrer",
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "Handoff",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Handoff — lock payment, inspect first, then hand off" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/opengraph-image", alt: "Handoff — lock payment, inspect first, then hand off" }],
    },
  };
}

export default async function DealPage({
  params,
}: {
  params: Promise<{ network: string; id: string }>;
}) {
  const { network, id } = await params;
  if (!isNetwork(network) || !/^\d+$/.test(id) || BigInt(id) === 0n) notFound();
  return (
    <AppFrame network={network}>
      <DealClient network={network} id={id} />
    </AppFrame>
  );
}
