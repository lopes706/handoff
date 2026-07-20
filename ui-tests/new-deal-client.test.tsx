import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

let mockConnected = false;
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock("@/components/network-client", () => ({
  useNetworkClient: () => ({
    account: "",
    connected: mockConnected,
    connecting: false,
    isMiniPay: false,
    repository,
    connect: mockConnect,
    disconnect: mockDisconnect,
  }),
}));

describe("new deal form accessibility copy", () => {
  it("links field guidance to the matching inputs", () => {
    mockConnected = false;
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

  it("announces transaction progress and errors as atomic updates", async () => {
    mockConnected = true;
    repository.createDeal = vi
      .fn()
      .mockImplementation(async (_deal, setTransaction) => {
        setTransaction({
          message: "Confirm in wallet",
          hash: "0x1234",
        });
        throw new Error("Wallet declined the request.");
      });

    render(<NewDealClient network="celo" />);

    fireEvent.change(screen.getByLabelText(/item or exchange title/i), {
      target: { value: "Vintage field camera" },
    });
    fireEvent.change(screen.getByLabelText(/exact amount/i), {
      target: { value: "12.50" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /create unlisted deal/i }),
    );

    const status = await screen.findByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(screen.getByText(/confirm in wallet/i)).toBeInTheDocument();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveAttribute("aria-atomic", "true");
    expect(alert).toHaveTextContent(/wallet declined the request/i);

    await waitFor(() => {
      expect(repository.createDeal).toHaveBeenCalled();
    });
  });
});
