import { formatCents } from "@/lib/money";
import type { Wish } from "@/lib/wishes";

/** Prix, lien et note d'une envie : partagé par la liste publique et la gestion. */
export function WishBody({ wish }: { wish: Wish }) {
  return (
    <div className="wish-body">
      <div className="wish-title">{wish.title}</div>
      {wish.priceCents !== null ? (
        <div className="wish-meta">environ {formatCents(wish.priceCents)}</div>
      ) : null}
      {wish.note ? <div className="wish-meta">{wish.note}</div> : null}
      {wish.link ? (
        <div className="wish-meta">
          <a href={wish.link} target="_blank" rel="noopener noreferrer">
            Voir le lien
          </a>
        </div>
      ) : null}
    </div>
  );
}
