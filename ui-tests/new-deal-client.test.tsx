import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NewDealClient } from "@/components/new-deal-client";
import type { HandoffRepository } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const repository = {
  network: "celo",
  configured: true,
  assetSymbol: "USDT",
  assetDecimals: 6,
  maxAmount: 50_000_000n,
} as Partial<HandoffRepository>;

vi.mock("@/components/network-client", () => ({
  useNetworkClient: () => ({
    account: "",
    connected: false,
    connecting: false,
    isMiniPay: false,
    repository,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

describe("new deal form accessibility copy", () => {
  it("links field guidance to the matching inputs", () => {
    render(<NewDealClient network="celo" />);

    expect(screen.getByLabelText(/item or exchange title/i)).toHaveAttribute(
      "aria-describedby",
      "title-hint",
    );
    expect(screen.getByText(/avoid sensitive personal information/i)).toHaveAttribute(
      "id",
      "title-hint",
    );

    expect(screen.getByLabelText(/exact amount/i)).toHaveAttribute(
      "aria-describedby",
      "amount-hint",
    );
    expect(screen.getByText(/maximum 50.00 usdt/i)).toHaveAttribute(
      "id",
      "amount-hint",
    );

    expect(screen.getByLabelText(/description/i)).toHaveAttribute(
      "aria-describedby",
      "description-hint",
    );
    expect(screen.getByText(/shared in the link fragment or exported file/i)).toHaveAttribute(
      "id",
      "description-hint",
    );

    expect(screen.getByLabelText(/meeting hint/i)).toHaveAttribute(
      "aria-describedby",
      "meeting-hint",
    );
    expect(screen.getByText(/short public clue/i)).toHaveAttribute(
      "id",
      "meeting-hint",
    );
  });
});
