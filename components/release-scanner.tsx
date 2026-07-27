"use client";
import { useEffect, useRef, useState } from "react";
import { CameraOff, ScanLine } from "lucide-react";

export function ReleaseScanner({ onRead }: { onRead(value: string): void }) {
  const video = useRef<HTMLVideoElement>(null); const [error, setError] = useState("");
  useEffect(() => { let controls: { stop(): void } | undefined; let live = true; void import("@zxing/browser").then(async ({ BrowserQRCodeReader }) => { try { const reader = new BrowserQRCodeReader(); controls = await reader.decodeFromVideoDevice(undefined, video.current!, (result) => { if (live && result) { onRead(result.getText()); controls?.stop(); } }); } catch { if (live) setError("Camera access is unavailable. Paste the release pass JSON or import the buyer backup below."); } }); return () => { live = false; controls?.stop(); }; }, [onRead]);
  return <div>{error ? <div className="scan-frame"><CameraOff aria-hidden="true" size={42} /><span className="sr-only">Camera unavailable</span></div> : <><div className="scan-frame"><video ref={video} className="scanner-video" muted playsInline aria-label="Release pass camera scanner" /><span className="sr-only">Scanner preview active</span><ScanLine aria-hidden="true" /></div><p className="fineprint" style={{ marginTop: 10 }}>Point the camera at the buyer&apos;s release pass QR. If scanning is blocked, paste the pass JSON or import the buyer backup below.</p></>}{error && <p role="alert" aria-atomic="true" className="warning"><CameraOff aria-hidden="true" />{error}</p>}</div>;
}
