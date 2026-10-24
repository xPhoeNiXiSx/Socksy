import Link from "next/link";

import { isUploadConfigured } from "@/lib/images";
import { listWishes } from "@/lib/wishes";

import { ListHero } from "../ui/list-hero";
import { siteOrigin } from "../ui/origin";
import { SetupScreen, missingConfig } from "../ui/setup";
import { Submit } from "../ui/submit";
import { TopBar } from "../ui/topbar";
import { WishDetails } from "../ui/wish-details";
import { deleteWishAction, logoutAction } from "./actions";
import { ShareLink } from "./share-link";
import { WishForm } from "./wish-form";

export const dynamic = "force-dynamic";

export default async function MyListPage() {
  const missing = missingConfig();
  if (missing.length > 0) return <SetupScreen missing={missing} />;

  // Le proxy a déjà vérifié la session avant d'arriver ici.
  const [wishes, origin] = await Promise.all([listWishes(), siteOrigin()]);

  return (
    <main className="page">
      <TopBar />
      <ListHero />

      <section className="panel">
        <h2>Partager ma liste</h2>
        <p className="muted" style={{ margin: 0 }}>
          Envoie ce lien : on peut réserver un cadeau sans compte. Tu ne verras
          jamais ce qui est réservé.
        </p>
        <ShareLink url={`${origin}/`} />
      </section>

      <WishForm uploads={isUploadConfigured()} />

      {wishes.length === 0 ? (
        <p className="empty">Ta liste est vide. Ajoute ta première envie !</p>
      ) : (
        <ul className="cards">
          {wishes.map((wish) => (
            <li key={wish.id} className="card">
              <WishDetails wish={wish} />
              <div className="card-actions">
                <Link href={`/ma-liste/modifier/${wish.id}`} className="link-btn">
                  Modifier
                </Link>
                <form action={deleteWishAction}>
                  <input type="hidden" name="id" value={wish.id} />
                  <Submit className="link-btn danger" pending="…">
                    Retirer
                  </Submit>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="footer" style={{ gap: 16 }}>
        <Link href="/" className="link-btn">
          Voir ma liste
        </Link>
        <form action={logoutAction}>
          <Submit className="link-btn" pending="…">
            Se déconnecter
          </Submit>
        </form>
      </div>
    </main>
  );
}
