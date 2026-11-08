import Link from "next/link";
import { notFound } from "next/navigation";

import { isOwner } from "@/lib/auth";
import { currentGuest } from "@/lib/guest";
import { getWish, listWishesForGuest, type Wish } from "@/lib/wishes";

import { cancelAction, reserveAction, setGuestNameAction } from "../../actions";
import { SetupScreen, missingConfig } from "../../ui/setup";
import { Submit } from "../../ui/submit";
import { TopBar } from "../../ui/topbar";
import { wishMeta } from "../../ui/wish-details";

export const dynamic = "force-dynamic";

/** Un identifiant d'envie est un uuid : tout le reste mène à la page introuvable. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** La photo en grand, le titre, le prix et la note. */
function WishHeader({ wish, taken }: { wish: Wish; taken: boolean }) {
  const meta = wishMeta(wish);
  return (
    <>
      {wish.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={taken ? "wish-photo taken" : "wish-photo"}
          src={wish.imageUrl}
          alt={wish.title}
          referrerPolicy="no-referrer"
        />
      ) : null}
      <div className="wish-heading">
        <h1>{wish.title}</h1>
        {meta ? <span className="card-meta">{meta}</span> : null}
      </div>
    </>
  );
}

function ProductLink({ wish }: { wish: Wish }) {
  return wish.link ? (
    <a className="btn plain block" href={wish.link} target="_blank" rel="noopener noreferrer">
      Voir le produit
    </a>
  ) : null;
}

export default async function WishPage({ params }: { params: Promise<{ id: string }> }) {
  const missing = missingConfig();
  if (missing.length > 0) return <SetupScreen missing={missing} />;

  const { id } = await params;
  if (!UUID.test(id)) notFound();

  // Le propriétaire voit son cadeau sans la réservation : elle n'est même
  // pas lue.
  if (await isOwner()) {
    const wish = await getWish(id);
    if (!wish) notFound();
    return (
      <main className="page">
        <TopBar />
        <Link href="/ma-liste" className="back">
          ← Ma liste
        </Link>
        <WishHeader wish={wish} taken={false} />
        <div className="actions">
          <ProductLink wish={wish} />
          <Link href={`/ma-liste/modifier/${wish.id}`} className="btn ink block">
            Modifier
          </Link>
        </div>
      </main>
    );
  }

  const guest = await currentGuest();
  const [wish] = await listWishesForGuest(guest?.id ?? null, id);
  if (!wish) notFound();
  const known = Boolean(guest?.name);

  return (
    <main className="page">
      <TopBar />
      <Link href="/" className="back">
        ← Toute la liste
      </Link>
      <WishHeader wish={wish} taken={Boolean(wish.reservedBy)} />

      <div className="actions">
        {wish.reservedBy ? (
          <>
            <span className="stamp" style={{ alignSelf: "flex-start" }}>
              {wish.mine ? "Pris par toi" : `Pris par ${wish.reservedBy}`}
            </span>
            {wish.mine ? (
              <form action={cancelAction}>
                <input type="hidden" name="wishId" value={wish.id} />
                <Submit className="link-btn" pending="…">
                  Annuler ma réservation
                </Submit>
              </form>
            ) : null}
          </>
        ) : known ? (
          <form action={reserveAction}>
            <input type="hidden" name="wishId" value={wish.id} />
            <Submit className="btn block" pending="…">
              Je l&apos;offre
            </Submit>
          </form>
        ) : (
          <form action={setGuestNameAction} className="panel form">
            <p className="lead">
              Pour réserver ce cadeau, dis-moi qui tu es. Moi, je ne verrai
              jamais ton prénom.
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
        <ProductLink wish={wish} />
      </div>
    </main>
  );
}
