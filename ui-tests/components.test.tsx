import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingDemo } from "@/components/landing-demo";
describe("landing preview",()=>{it("is explicitly local and advances through the handoff phases",()=>{render(<LandingDemo/>);expect(screen.getByText(/Local preview · not live/i)).toBeInTheDocument();fireEvent.click(screen.getByRole("button",{name:/Lock payment/i}));expect(screen.getByText(/buyer verifies the private sheet/i)).toBeInTheDocument();expect(screen.getByText(/funded/i,{selector:".status-tape"})).toBeInTheDocument();});});
