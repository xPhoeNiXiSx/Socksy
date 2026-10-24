import Link from "next/link";

import { isOwner } from "@/lib/auth";
import { currentGuest } from "@/lib/guest";
import { listWishes, listWishesForGuest } from "@/lib/wishes";

import { cancelAction, reserveAction, setGuestNameAction } from "./actions";
import { ListHero } from "./ui/list-hero";
import { SetupScreen, missingConfig } from "./ui/setup";
import { Submit } from "./ui/submit";
import { TopBar } from "./ui/topbar";
import { WishDetails } from "./ui/wish-details";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const missing = missingConfig();
  if (missing.length > 0) return <SetupScreen missing={missing} />;

  // Le propriétaire voit sa liste telle quelle : les réservations ne sont
  // même pas lues.
  if (await isOwner()) {
    const wishes = await listWishes();
    return (
      <main className="page">
        <TopBar />
        <ListHero />
        <p className="lead">
          C&apos;est ta liste telle que les invités la voient — sans les
          réservations, pour garder la surprise.
        </p>
        <ul className="cards">
          {wishes.map((wish) => (
            <li key={wish.id} className="card">
              <WishDetails wish={wish} />
            </li>
          ))}
        </ul>
        <Link href="/ma-liste" className="btn ink block">
          Modifier ma liste
        </Link>
      </main>
    );
  }

  const guest = await currentGuest();
  const wishes = await listWishesForGuest(guest?.id ?? null);
  const known = Boolean(guest?.name);

  return (
    <main className="page">
      <TopBar />
      <ListHero />

      {known ? (
        <p className="lead">
          Bonjour {guest?.name} ! Choisis un cadeau : je ne verrai jamais qui
          l&apos;a pris.
        </p>
      ) : (
        <form action={setGuestNameAction} className="panel form">
          <p className="lead">
            Qui es-tu ? Ton prénom s&apos;affiche sur les cadeaux que tu
            réserves, pour que les autres ne prennent pas le même. Moi, je ne
            le verrai jamais.
          </p>
          <div className="row">
            <label>
              Ton prénom
              <input name="name" autoComplete="given-name" maxLength={40} required />
            </label>
            <Submit className="btn ink" pending="…">
              C&apos;est moi
            </Submit>
          </div>
        </form>
      )}

      {wishes.length === 0 ? (
        <p className="empty">La liste est encore vide.</p>
      ) : (
        <ul className="cards">
          {wishes.map((wish) => (
            <li key={wish.id} className={wish.reservedBy ? "card taken" : "card"}>
              <WishDetails wish={wish} />
              <div className="card-actions">
                {wish.reservedBy ? (
                  <>
                    <span className="stamp">
                      {wish.mine ? "Pris par toi" : `Pris par ${wish.reservedBy}`}
                    </span>
                    {wish.mine ? (
                      <form action={cancelAction}>
                        <input type="hidden" name="wishId" value={wish.id} />
                        <Submit className="link-btn" pending="…">
                          Annuler
                        </Submit>
                      </form>
                    ) : null}
                  </>
                ) : known ? (
                  <form action={reserveAction}>
                    <input type="hidden" name="wishId" value={wish.id} />
                    <Submit pending="…">Je l&apos;offre</Submit>
                  </form>
                ) : (
                  <button type="button" className="btn" disabled>
                    Je l&apos;offre
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="footer">
        <Link href="/login" className="link-btn">
          C&apos;est ma liste
        </Link>
      </div>
    </main>
  );
}
