import { notFound } from "next/navigation";

import { isUploadConfigured } from "@/lib/images";
import { getWish } from "@/lib/wishes";

import { Hero } from "../../../ui/hero";
import { SetupScreen, missingConfig } from "../../../ui/setup";
import { TopBar } from "../../../ui/topbar";
import { EditWishForm } from "../../wish-form";

export const dynamic = "force-dynamic";

/** Un identifiant d'envie est un uuid : tout le reste mène à la page introuvable. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditWishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const missing = missingConfig();
  if (missing.length > 0) return <SetupScreen missing={missing} />;

  // Le proxy a déjà vérifié la session avant d'arriver ici.
  const { id } = await params;
  const wish = UUID.test(id) ? await getWish(id) : null;
  if (!wish) notFound();

  return (
    <main className="page">
      <TopBar />
      <Hero kicker="Modifier" title={wish.title} />
      <EditWishForm wish={wish} uploads={isUploadConfigured()} />
    </main>
  );
}
