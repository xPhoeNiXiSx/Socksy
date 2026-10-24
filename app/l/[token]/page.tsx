import Link from "next/link";
import { notFound } from "next/navigation";

import { getUserByShareToken } from "@/lib/accounts";
import { currentUser } from "@/lib/auth";
import { currentGuest } from "@/lib/guest";
import { listWishes, listWishesForGuest } from "@/lib/wishes";

import { Hero } from "../../ui/hero";
import { SetupScreen, missingConfig } from "../../ui/setup";
import { Submit } from "../../ui/submit";
import { TopBar } from "../../ui/topbar";
import { WishDetails } from "../../ui/wish-details";
import { cancelAction, reserveAction, setGuestNameAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SharedListPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const missing = missingConfig();
  if (missing.length > 0) return <SetupScreen missing={missing} />;

  const { token } = await params;
  const owner = await getUserByShareToken(token);
  if (!owner) notFound();

  const user = await currentUser();

  // Le propriétaire qui ouvre son propre lien voit sa liste telle quelle :
  // les réservations ne sont même pas lues.
  if (user?.id === owner.id) {
    const wishes = await listWishes(owner.id);
    return (
      <main className="page">
        <TopBar />
        <Hero kicker="La liste de" title={owner.name} />
        <p className="lead">
          C&apos;est ta liste telle que les autres la voient — sans les
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

  const guest = await currentGuest(user);
  const wishes = await listWishesForGuest(owner.id, guest?.id ?? null);
  const known = Boolean(guest?.name);

  return (
    <main className="page">
      <TopBar />
      <Hero kicker="La liste de" title={owner.name} />

      {known ? (
        <p className="lead">
          Bonjour {guest?.name} ! Choisis un cadeau : {owner.name} ne verra
          jamais qui l&apos;a pris.
        </p>
      ) : (
        <form action={setGuestNameAction} className="panel form">
          <input type="hidden" name="token" value={token} />
          <p className="lead">
            Qui es-tu ? Ton prénom s&apos;affiche sur les cadeaux que tu
            réserves, pour que les autres ne prennent pas le même.{" "}
            {owner.name} ne le verra jamais.
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
        <p className="empty">{owner.name} n&apos;a encore rien ajouté.</p>
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
                        <input type="hidden" name="token" value={token} />
                        <input type="hidden" name="wishId" value={wish.id} />
                        <Submit className="link-btn" pending="…">
                          Annuler
                        </Submit>
                      </form>
                    ) : null}
                  </>
                ) : (
                  <form action={reserveAction}>
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="wishId" value={wish.id} />
                    {known ? (
                      <Submit pending="…">Je l&apos;offre</Submit>
                    ) : (
                      <button type="button" className="btn" disabled>
                        Je l&apos;offre
                      </button>
                    )}
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
