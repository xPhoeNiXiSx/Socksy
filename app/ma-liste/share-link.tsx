"use client";

import { useState } from "react";

/** Le lien de partage, avec copie en un geste (ou le menu de partage du téléphone). */
export function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Ma liste de Noël", url });
        return;
      } catch {
        // Partage annulé : on retombe sur la copie.
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="share">
      <input value={url} readOnly aria-label="Lien de ta liste" onFocus={(e) => e.target.select()} />
      <button type="button" className="btn sun" onClick={share}>
        {copied ? "Copié !" : "Partager"}
      </button>
    </div>
  );
}
