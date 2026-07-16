import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F2E9D8",
      }}
    >
      <div
        style={{
          width: 128,
          height: 128,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1D4ED8",
          color: "white",
          border: "6px solid #18201C",
          boxShadow: "8px 8px 0 #18201C",
          fontSize: 74,
          fontWeight: 900,
        }}
      >
        H
      </div>
    </div>,
    size,
  );
}
