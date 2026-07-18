"use client";
import { useRef, useState } from "react";
import { Check, LockKeyhole, PackageOpen } from "lucide-react";

const steps = [
  { title: "Create label", copy: "Seller writes the item, price, meeting hint and expiry.", icon: PackageOpen },
  { title: "Lock payment", copy: "Buyer verifies the private sheet and funds the onchain escrow.", icon: LockKeyhole },
  { title: "Hand over", copy: "Buyer inspects the item, then releases directly or shows a one-time pass.", icon: Check }
];
export function LandingDemo() {
  const [active, setActive] = useState(0); const tabRefs = useRef<Array<HTMLButtonElement | null>>([]); const step = steps[active]; const Icon = step.icon;
  const panelId = "demo-step-panel";
  const instructionsId = "demo-step-instructions";
  const focusStep = (index: number) => {
    setActive(index);
    tabRefs.current[index]?.focus();
  };
  return <div className="parcel hero-visual" aria-label="Local interactive preview"><div className="label"><div className="label-head"><div><span className="eyebrow">Local preview · not live</span><h3 style={{ margin: "5px 0 0" }}>Dispatch #0042</h3></div><span className="status-tape">{active === 0 ? "open" : active === 1 ? "funded" : "released"}</span></div><div className="barcode" aria-hidden="true" /><p className="sr-only" id={instructionsId}>Deal flow preview. Use Left and Right Arrow to move between steps, or Home and End to jump to the first or last step.</p><div aria-atomic="true" aria-labelledby={`demo-step-tab-${active}`} aria-live="polite" id={panelId} role="tabpanel" style={{ display: "flex", gap: 14, alignItems: "center", margin: "17px 0" }}><Icon aria-hidden="true" /><div><strong>{step.title}</strong><p className="fineprint" style={{ margin: 0 }}>{step.copy}</p></div></div><div aria-describedby={instructionsId} aria-keyshortcuts="ArrowLeft ArrowRight Home End" aria-label="Deal flow preview steps" aria-orientation="horizontal" className="demo-steps" role="tablist">{steps.map((item, index) => <button key={item.title} aria-controls={panelId} aria-selected={index === active} id={`demo-step-tab-${index}`} onClick={() => setActive(index)} onKeyDown={(event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusStep((index + 1) % steps.length);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusStep((index - 1 + steps.length) % steps.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusStep(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusStep(steps.length - 1);
    }
  }} ref={(node) => {
    tabRefs.current[index] = node;
  }} className="demo-step" role="tab" style={{ width: "100%", borderInline: 0, borderTop: 0, background: index === active ? "#f4c95d55" : "transparent", textAlign: "left" }} tabIndex={index === active ? 0 : -1} type="button"><b>{index + 1}</b><span><strong>{item.title}</strong><small style={{ display: "block" }}>{index < active ? "Complete" : index === active ? "Current stop" : "Waiting"}</small></span></button>)}</div></div></div>;
}
