import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          width: 360,
          height: 360,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1D4ED8",
          color: "white",
          border: "18px solid #18201C",
          boxShadow: "22px 22px 0 #18201C",
          fontSize: 212,
          fontWeight: 900,
        }}
      >
        H
      </div>
    </div>,
    size,
  );
}
