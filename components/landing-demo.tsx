"use client";
import { useState } from "react";
import { Check, LockKeyhole, PackageOpen } from "lucide-react";

const steps = [
  { title: "Create label", copy: "Seller writes the item, price, meeting hint and expiry.", icon: PackageOpen },
  { title: "Lock payment", copy: "Buyer verifies the private sheet and funds the onchain escrow.", icon: LockKeyhole },
  { title: "Hand over", copy: "Buyer inspects the item, then releases directly or shows a one-time pass.", icon: Check }
];
export function LandingDemo() {
  const [active, setActive] = useState(0); const step = steps[active]; const Icon = step.icon;
  return <div className="parcel hero-visual" aria-label="Local interactive preview"><div className="label"><div className="label-head"><div><span className="eyebrow">Local preview · not live</span><h3 style={{ margin: "5px 0 0" }}>Dispatch #0042</h3></div><span className="status-tape">{active === 0 ? "open" : active === 1 ? "funded" : "released"}</span></div><div className="barcode" aria-hidden="true" /><div style={{ display: "flex", gap: 14, alignItems: "center", margin: "17px 0" }}><Icon aria-hidden="true" /><div><strong>{step.title}</strong><p className="fineprint" style={{ margin: 0 }}>{step.copy}</p></div></div><div className="demo-steps">{steps.map((item, index) => <button key={item.title} type="button" onClick={() => setActive(index)} className="demo-step" style={{ width: "100%", borderInline: 0, borderTop: 0, background: index === active ? "#f4c95d55" : "transparent", textAlign: "left" }} aria-pressed={index === active}><b>{index + 1}</b><span><strong>{item.title}</strong><small style={{ display: "block" }}>{index < active ? "Complete" : index === active ? "Current stop" : "Waiting"}</small></span></button>)}</div></div></div>;
}
