import { formatCents } from "@/lib/money";
import type { Wish } from "@/lib/wishes";

/** Titre, prix, note et lien d'une envie : commun à toutes les vues. */
export function WishDetails({ wish }: { wish: Wish }) {
  const meta = [
    wish.priceCents !== null ? formatCents(wish.priceCents) : null,
    wish.note,
  ].filter(Boolean);

  return (
    <div className="card-body">
      <span className="card-title">{wish.title}</span>
      {meta.length > 0 ? <span className="card-meta">{meta.join(" · ")}</span> : null}
      {wish.link ? (
        <a className="card-meta" href={wish.link} target="_blank" rel="noopener noreferrer">
          Voir le lien
        </a>
      ) : null}
    </div>
  );
}
