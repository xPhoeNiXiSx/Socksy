"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { closeSession, isOwner } from "@/lib/auth";
import { parseEuros } from "@/lib/money";
import { createWish, deleteWish, normalizeLink } from "@/lib/wishes";

export type WishFormState = { error?: string; ok?: number };

/**
 * Le proxy ferme déjà /ma-liste, mais une action serveur reste un point
 * d'entrée à part entière : elle vérifie la session elle-même.
 */
async function requireOwner(): Promise<void> {
  if (!(await isOwner())) redirect("/login?next=/ma-liste");
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function addWishAction(
  state: WishFormState,
  formData: FormData,
): Promise<WishFormState> {
  await requireOwner();

  const title = text(formData, "title");
  if (!title) return { error: "Donne un nom à ton envie." };

  const link = normalizeLink(text(formData, "link"));
  if (link === undefined) return { error: "Ce lien n'est pas valide." };

  const priceCents = parseEuros(text(formData, "price"));
  if (priceCents === undefined) {
    return { error: "Le prix doit être un montant, par exemple 24,90." };
  }

  await createWish({
    title,
    link,
    priceCents,
    note: text(formData, "note") || null,
  });
  revalidatePath("/ma-liste");
  revalidatePath("/");
  // Le compteur change à chaque ajout : le formulaire s'en sert pour se vider.
  return { ok: (state.ok ?? 0) + 1 };
}

export async function deleteWishAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = text(formData, "id");
  if (id) await deleteWish(id);
  revalidatePath("/ma-liste");
  revalidatePath("/");
}

export async function logoutAction(): Promise<void> {
  await closeSession();
  redirect("/");
}
