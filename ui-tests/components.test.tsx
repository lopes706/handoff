import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";
import Home from "@/app/page";
import { LandingDemo } from "@/components/landing-demo";
import { SiteHeader } from "@/components/site-header";

describe("site header", () => {
  it("keeps the primary navigation links available", () => {
    render(<SiteHeader />);
    const homeLink = screen.getByRole("link", { name: /handoff home/i });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(homeLink).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: /jump to how handoff works/i }),
    ).toHaveAttribute("href", "/#how");
    expect(
      screen.getByRole("link", { name: /jump to safety boundaries/i }),
    ).toHaveAttribute("href", "/#safety");
    expect(
      screen.getByRole("link", { name: /open celo dashboard/i }),
    ).toHaveAttribute("href", "/app/celo");
    expect(
      screen.getByRole("link", { name: /open stacks dashboard/i }),
    ).toHaveAttribute("href", "/app/stacks");
  });
});

describe("landing preview",()=>{it("is explicitly local and advances through the handoff phases",()=>{render(<LandingDemo/>);expect(screen.getByText(/Local preview · not live/i)).toBeInTheDocument();expect(screen.getByRole("region",{name:/Deal #0042/i})).toBeInTheDocument();expect(screen.getByText(/Home and End to jump to the first or last step/i)).toBeInTheDocument();const tablist=screen.getByRole("tablist",{name:/Deal flow preview steps/i});expect(tablist).toHaveAttribute("aria-keyshortcuts","ArrowLeft ArrowRight Home End");fireEvent.click(screen.getByRole("tab",{name:/Lock payment/i}));expect(screen.getByText(/buyer verifies the private sheet/i)).toBeInTheDocument();expect(screen.getByText(/funded/i,{selector:".status-tape"})).toBeInTheDocument();const panel=screen.getByRole("tabpanel");expect(panel).toHaveAttribute("id","demo-step-panel");expect(screen.getByRole("tab",{name:/Lock payment/i})).toHaveAttribute("aria-controls","demo-step-panel");expect(panel).toHaveAttribute("aria-labelledby","demo-step-tab-1");});});

describe("landing page", () => {
  it("uses explicit labels for in-page jump links", () => {
    render(<Home />);
    expect(
      screen
        .getAllByRole("link", { name: /jump to how handoff works/i })
        .find((link) => link.getAttribute("href") === "#how"),
    ).toBeDefined();
    expect(
      screen
        .getAllByRole("link", { name: /jump to safety boundaries/i })
        .find((link) => link.getAttribute("href") === "#safety"),
    ).toBeDefined();
  });

  it("describes the onchain fingerprint without an ambiguous owner", () => {
    render(<Home />);
    expect(
      screen.getByText(/only the sha-256 fingerprint goes onchain/i),
    ).toBeInTheDocument();
  });
});

describe("not found page", () => {
  it("points people to dashboard import flows when a deal link is incomplete", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("link", { name: /import on celo dashboard/i }),
    ).toHaveAttribute("href", "/app/celo");
    expect(
      screen.getByRole("link", { name: /import on stacks dashboard/i }),
    ).toHaveAttribute("href", "/app/stacks");
  });
});
