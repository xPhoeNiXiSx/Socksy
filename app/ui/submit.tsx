"use client";

import { useFormStatus } from "react-dom";

/** Bouton d'envoi qui se désactive pendant l'envoi, pour éviter le double clic. */
export function Submit({
  children,
  pending,
  className = "btn",
}: {
  children: React.ReactNode;
  pending: string;
  className?: string;
}) {
  const status = useFormStatus();
  return (
    <button type="submit" className={className} disabled={status.pending}>
      {status.pending ? pending : children}
    </button>
  );
}
