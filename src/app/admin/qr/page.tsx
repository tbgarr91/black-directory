"use client";

import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AdminGate } from "@/components/AdminGate";

function QrContent() {
  const [baseUrl, setBaseUrl] = useState("");
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Default to the current deployed origin, so it works right out of the box.
    setBaseUrl(window.location.origin);
  }, []);

  const submitUrl = `${baseUrl.replace(/\/$/, "")}/submit`;

  function downloadPng() {
    const svg = svgWrapperRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 8; // high-res for print
      canvas.width = 288 * scale;
      canvas.height = 288 * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = "list-your-business-qr.png";
      link.click();
    };
    img.src = url;
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-14">
      <h1 className="font-display text-3xl text-ink">Submission QR code</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Print this and hand it out at events — anyone who scans it lands
        directly on the self-submission form, no typing required. It always
        points to <code className="text-xs">/submit</code> on whatever URL
        you enter below.
      </p>

      <label className="mt-6 block text-sm font-medium text-ink">
        Site URL
        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://your-deployed-site.vercel.app"
          className="mt-1 w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/20"
        />
      </label>

      <div
        ref={svgWrapperRef}
        className="mt-6 inline-block rounded-sm border border-rule bg-white p-6"
      >
        <QRCodeSVG value={submitUrl} size={240} level="M" />
      </div>

      <p className="mt-3 text-xs text-ink-soft">{submitUrl}</p>

      <button
        onClick={downloadPng}
        className="mt-4 rounded-sm bg-indigo px-4 py-2 text-sm font-medium text-paper hover:bg-indigo-dim transition-colors"
      >
        Download PNG for printing
      </button>
    </main>
  );
}

export default function QrPage() {
  return (
    <AdminGate>
      <QrContent />
    </AdminGate>
  );
}
