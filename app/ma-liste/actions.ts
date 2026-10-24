"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { closeSession, currentUser } from "@/lib/auth";
import { parseEuros } from "@/lib/money";
import { createWish, deleteWish, normalizeLink } from "@/lib/wishes";

export type WishFormState = { error?: string; ok?: number };

/**
 * Le proxy ferme déjà /ma-liste, mais une action serveur reste un point
 * d'entrée à part entière : elle retrouve le compte elle-même.
 */
async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/ma-liste");
  return user;
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function addWishAction(
  state: WishFormState,
  formData: FormData,
): Promise<WishFormState> {
  const user = await requireUser();

  const title = text(formData, "title");
  if (!title) return { error: "Donne un nom à ton envie." };

  const link = normalizeLink(text(formData, "link"));
  if (link === undefined) return { error: "Ce lien n'est pas valide." };

  const priceCents = parseEuros(text(formData, "price"));
  if (priceCents === undefined) {
    return { error: "Le prix doit être un montant, par exemple 24,90." };
  }

  await createWish(user.id, {
    title,
    link,
    priceCents,
    note: text(formData, "note") || null,
  });
  revalidatePath("/ma-liste");
  // Le compteur change à chaque ajout : le formulaire s'en sert pour se vider.
  return { ok: (state.ok ?? 0) + 1 };
}

export async function deleteWishAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = text(formData, "id");
  if (id) await deleteWish(user.id, id);
  revalidatePath("/ma-liste");
}

export async function logoutAction(): Promise<void> {
  await closeSession();
  redirect("/");
}
