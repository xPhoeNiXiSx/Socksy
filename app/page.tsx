import Link from "next/link";
import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";

import { Hero } from "./ui/hero";
import { SetupScreen, missingConfig } from "./ui/setup";
import { TopBar } from "./ui/topbar";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const missing = missingConfig();
  if (missing.length > 0) return <SetupScreen missing={missing} />;

  if (await currentUser()) redirect("/ma-liste");

  return (
    <main className="page">
      <TopBar />
      <Hero kicker="Les listes de Noël" title="de la famille" />
      <p className="lead">
        Chacun écrit ce qui lui ferait plaisir et partage sa liste. Les autres
        réservent un cadeau en un clic — et toi, tu ne vois jamais qui offre quoi.
      </p>
      <Link href="/inscription" className="btn block">
        Créer ma liste
      </Link>
      <Link href="/login" className="btn plain block">
        J&apos;ai déjà un compte
      </Link>
    </main>
  );
}
