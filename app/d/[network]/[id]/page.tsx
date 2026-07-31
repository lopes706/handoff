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
  return {
    title: `${networkLabel(network)} private deal #${id}`,
    description,
    robots: { index: false, follow: false },
    referrer: "no-referrer",
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
