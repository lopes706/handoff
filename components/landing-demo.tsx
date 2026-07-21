"use client";

import { useRef, useState } from "react";
import { Check, LockKeyhole, PackageOpen } from "lucide-react";

const steps = [
  { title: "Create deal sheet", copy: "Seller writes the item, price, meeting hint and expiry.", icon: PackageOpen },
  { title: "Lock payment", copy: "Buyer verifies the private sheet and funds the onchain escrow.", icon: LockKeyhole },
  { title: "Hand over", copy: "Buyer inspects the item, then releases directly or shows a one-time pass.", icon: Check }
];

export function LandingDemo() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const step = steps[active];
  const Icon = step.icon;
  const panelId = "demo-step-panel";
  const instructionsId = "demo-step-instructions";
  const previewNoteId = "demo-preview-note";
  const previewTitleId = "demo-preview-title";

  const focusStep = (index: number) => {
    setActive(index);
    tabRefs.current[index]?.focus();
  };

  return (
    <div
      className="parcel hero-visual"
      aria-describedby={`${previewNoteId} ${instructionsId}`}
      aria-labelledby={previewTitleId}
      role="region"
    >
      <div className="label">
        <div className="label-head">
          <div>
            <span className="eyebrow" aria-hidden="true">Local preview · not live</span>
            <h3 id={previewTitleId} style={{ margin: "5px 0 0" }}>Deal #0042</h3>
          </div>
          <span className="status-tape">{active === 0 ? "open" : active === 1 ? "funded" : "released"}</span>
        </div>
        <div className="barcode" aria-hidden="true" />
        <p className="sr-only" id={previewNoteId}>
          Local preview only. This demo is not connected to live contract data and cannot submit a real handoff.
        </p>
        <p className="sr-only" id={instructionsId}>
          Deal flow preview. Use Left and Right Arrow to move between steps, or Home and End to jump to the first or last step.
        </p>
        <div
          aria-atomic="true"
          aria-labelledby={`demo-step-tab-${active}`}
          aria-live="polite"
          id={panelId}
          role="tabpanel"
          style={{ display: "flex", gap: 14, alignItems: "center", margin: "17px 0" }}
        >
          <Icon aria-hidden="true" />
          <div>
            <strong>{step.title}</strong>
            <p className="fineprint" style={{ margin: 0 }}>{step.copy}</p>
          </div>
        </div>
        <div
          aria-describedby={instructionsId}
          aria-keyshortcuts="ArrowLeft ArrowRight Home End"
          aria-label="Deal flow preview steps"
          aria-orientation="horizontal"
          className="demo-steps"
          role="tablist"
        >
          {steps.map((item, index) => {
            const stepState = index < active ? "Complete" : index === active ? "Current stop" : "Waiting";

            return (
              <button
                key={item.title}
                aria-controls={panelId}
                aria-label={`${item.title}, step ${index + 1} of ${steps.length}, ${stepState}`}
                aria-posinset={index + 1}
                aria-selected={index === active}
                aria-setsize={steps.length}
                data-state={index < active ? "complete" : index === active ? "current" : "upcoming"}
                id={`demo-step-tab-${index}`}
                onClick={() => setActive(index)}
                onKeyDown={(event) => {
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
                }}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                className="demo-step"
                role="tab"
                style={{ width: "100%", borderInline: 0, borderTop: 0, textAlign: "left" }}
                tabIndex={index === active ? 0 : -1}
                type="button"
              >
                <b>{index + 1}</b>
                <span>
                  <strong>{item.title}</strong>
                  <small style={{ display: "block" }}>{stepState}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
