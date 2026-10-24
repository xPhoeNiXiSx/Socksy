import Link from "next/link";

import { isAuthConfigured } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { listWishes } from "@/lib/wishes";

import { WishBody } from "../wish-meta";
import { deleteWishAction } from "./actions";
import { WishForm } from "./wish-form";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const missing = [
    !isDatabaseConfigured() && "DATABASE_URL",
    !process.env.APP_PASSWORD && "APP_PASSWORD",
    !process.env.AUTH_SECRET && "AUTH_SECRET",
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0 || !isAuthConfigured()) {
    return (
      <main className="page">
        <h1>Gérer ma liste</h1>
        <p className="hint">
          Il manque dans les variables d&apos;environnement Vercel :{" "}
          {missing.map((name) => (
            <code key={name}>{name} </code>
          ))}
          puis redéploie.
        </p>
      </main>
    );
  }

  const wishes = await listWishes();

  return (
    <main className="page">
      <div className="nav">
        <h1>Gérer ma liste</h1>
        <Link href="/">Voir la liste</Link>
      </div>

      <WishForm />

      <ul className="wishes">
        {wishes.map((wish) => (
          <li key={wish.id} className="wish">
            <WishBody wish={wish} />
            <form action={deleteWishAction}>
              <input type="hidden" name="id" value={wish.id} />
              <button type="submit" className="ghost">
                Retirer
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
