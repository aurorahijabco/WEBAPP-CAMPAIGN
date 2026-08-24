"use client";

import { useState } from "react";

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-full bg-gold-400 text-plum-700 text-xs font-semibold px-3 py-1.5"
    >
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}
