import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingDemo } from "@/components/landing-demo";
import { SiteHeader } from "@/components/site-header";

describe("site header", () => {
  it("keeps both primary navigation links available", () => {
    render(<SiteHeader />);
    const homeLink = screen.getByRole("link", { name: /handoff home/i });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(homeLink).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: /how handoff works/i }),
    ).toHaveAttribute("href", "/#how");
    expect(
      screen.getByRole("link", { name: /open handoff app/i }),
    ).toHaveAttribute("href", "/app");
  });
});

describe("landing preview",()=>{it("is explicitly local and advances through the handoff phases",()=>{render(<LandingDemo/>);expect(screen.getByText(/Local preview · not live/i)).toBeInTheDocument();expect(screen.getByRole("region",{name:/Deal #0042/i})).toBeInTheDocument();expect(screen.getByText(/Home and End to jump to the first or last step/i)).toBeInTheDocument();const tablist=screen.getByRole("tablist",{name:/Deal flow preview steps/i});expect(tablist).toHaveAttribute("aria-keyshortcuts","ArrowLeft ArrowRight Home End");fireEvent.click(screen.getByRole("tab",{name:/Lock payment/i}));expect(screen.getByText(/buyer verifies the private sheet/i)).toBeInTheDocument();expect(screen.getByText(/funded/i,{selector:".status-tape"})).toBeInTheDocument();const panel=screen.getByRole("tabpanel");expect(panel).toHaveAttribute("id","demo-step-panel");expect(screen.getByRole("tab",{name:/Lock payment/i})).toHaveAttribute("aria-controls","demo-step-panel");expect(panel).toHaveAttribute("aria-labelledby","demo-step-tab-1");});});
