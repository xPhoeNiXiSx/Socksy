import { isDatabaseConfigured } from "@/lib/db";
import { listWishes } from "@/lib/wishes";

import { WishBody } from "./wish-meta";

// La liste change dès qu'une envie est ajoutée : jamais de rendu figé au build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="page">
        <h1>Ma liste de Noël</h1>
        <p className="hint">
          La base n&apos;est pas encore reliée : ajoute <code>DATABASE_URL</code>{" "}
          dans Vercel, puis redéploie.
        </p>
      </main>
    );
  }

  const wishes = await listWishes();

  return (
    <main className="page">
      <h1>Ma liste de Noël</h1>
      {wishes.length === 0 ? (
        <p className="hint">La liste est encore vide.</p>
      ) : (
        <ul className="wishes">
          {wishes.map((wish) => (
            <li key={wish.id} className="wish">
              <WishBody wish={wish} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
