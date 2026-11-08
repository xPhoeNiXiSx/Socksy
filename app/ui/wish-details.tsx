import Link from "next/link";

import { formatCents } from "@/lib/money";
import type { Wish } from "@/lib/wishes";

/** « 59,00 € · Taille M » : le prix et la note, quand il y en a. */
export function wishMeta(wish: Wish): string {
  return [wish.priceCents !== null ? formatCents(wish.priceCents) : null, wish.note]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Vignette, titre, prix, note et lien d'une envie : commun à toutes les
 * listes. La vignette et le titre mènent à la page du cadeau.
 */
export function WishDetails({ wish }: { wish: Wish }) {
  const meta = wishMeta(wish);
  const page = `/envie/${wish.id}`;

  return (
    <>
      {wish.imageUrl ? (
        <Link href={page} className="card-thumb-link" aria-hidden="true" tabIndex={-1}>
          {/* Images de boutiques tierces : pas d'optimisation Next, et pas de
              référent envoyé, que certaines boutiques refusent. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="card-thumb"
            src={wish.imageUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </Link>
      ) : null}
      <div className="card-body">
        <Link href={page} className="card-title">
          {wish.title}
        </Link>
        {meta ? <span className="card-meta">{meta}</span> : null}
        {wish.link ? (
          <a className="card-meta" href={wish.link} target="_blank" rel="noopener noreferrer">
            Voir le lien
          </a>
        ) : null}
      </div>
    </>
  );
}
