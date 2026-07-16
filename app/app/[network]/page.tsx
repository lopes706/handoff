import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppFrame } from "@/components/app-frame";
import { DashboardClient } from "@/components/dashboard-client";
import { isNetwork } from "@/lib/format";
export const metadata: Metadata = { title: "Manifest" };
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
    <AppFrame network={network}>
      <DashboardClient network={network} preview={preview === "1"} />
    </AppFrame>
  );
}
