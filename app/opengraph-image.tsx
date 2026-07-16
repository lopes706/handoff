import { ImageResponse } from "next/og";
export const alt = "Handoff — lock payment, inspect first, then hand off";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#F2E9D8",
        color: "#18201C",
        padding: "62px",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          border: "4px solid #18201C",
          boxShadow: "12px 12px 0 #18201C",
          background: "#FFFAF0",
          padding: "54px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: "62%" }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 4 }}>
            IN-PERSON ESCROW · CELO + STACKS
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 82,
              fontWeight: 900,
              lineHeight: 0.95,
              marginTop: 30,
            }}
          >
            <span>Lock payment.</span>
            <span style={{ color: "#1D4ED8" }}>Inspect first.</span>
            <span>Then hand off.</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: 300,
            height: 390,
            border: "4px solid #18201C",
            background: "white",
            padding: 28,
            flexDirection: "column",
            transform: "rotate(3deg)",
          }}
        >
          <div
            style={{
              display: "flex",
              background: "#F4C95D",
              border: "3px solid #18201C",
              padding: "12px 18px",
              fontWeight: 800,
              alignSelf: "flex-end",
            }}
          >
            FUNDED
          </div>
          <div
            style={{
              display: "flex",
              height: 70,
              marginTop: 28,
              background:
                "repeating-linear-gradient(90deg,#18201C 0 4px,transparent 4px 9px)",
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 38,
              fontWeight: 900,
              marginTop: 28,
              flexDirection: "column",
            }}
          >
            <span>HANDOFF</span>
            <span>#0042</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "auto",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            inspect · exchange · release
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
