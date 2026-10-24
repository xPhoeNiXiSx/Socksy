"use server";

import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { closeSession, isOwner } from "@/lib/auth";
import { fetchLinkImage, isStoredImage, isUploadConfigured } from "@/lib/images";
import { parseEuros } from "@/lib/money";
import {
  createWish,
  deleteWish,
  normalizeLink,
  updateWish,
  type WishInput,
} from "@/lib/wishes";

export type WishFormState = { error?: string; ok?: number };

/** Le navigateur réduit la photo avant l'envoi : au-delà, ce n'est pas normal. */
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

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

/** La photo envoyée, si l'on en a choisi une. */
function photoOf(formData: FormData): File | null {
  const value = formData.get("photo");
  return value instanceof File && value.size > 0 ? value : null;
}

/**
 * Lit et vérifie le formulaire d'une envie, commun à l'ajout et à la
 * modification. La photo se choisit dans cet ordre : celle qu'on envoie,
 * puis l'adresse d'image collée, puis celle de la page du lien.
 */
async function readWish(formData: FormData): Promise<WishInput | { error: string }> {
  const title = text(formData, "title");
  if (!title) return { error: "Donne un nom à ton envie." };

  const link = normalizeLink(text(formData, "link"));
  if (link === undefined) return { error: "Ce lien n'est pas valide." };

  const priceCents = parseEuros(text(formData, "price"));
  if (priceCents === undefined) {
    return { error: "Le prix doit être un montant, par exemple 24,90." };
  }

  const pastedImage = text(formData, "imageUrl");
  const imageAddress = pastedImage ? normalizeLink(pastedImage) : null;
  if (imageAddress === undefined) return { error: "L'adresse de l'image n'est pas valide." };

  const photo = photoOf(formData);
  let imageUrl: string | null;
  if (photo) {
    if (!isUploadConfigured()) {
      return { error: "L'envoi de photos n'est pas encore activé (Vercel Blob)." };
    }
    if (!photo.type.startsWith("image/")) return { error: "Ce fichier n'est pas une image." };
    if (photo.size > MAX_PHOTO_BYTES) return { error: "Cette photo est trop lourde." };

    const blob = await put(`envies/${crypto.randomUUID()}.jpg`, photo, {
      access: "public",
      contentType: photo.type,
    });
    imageUrl = blob.url;
  } else if (imageAddress) {
    imageUrl = imageAddress;
  } else {
    imageUrl = link ? await fetchLinkImage(link) : null;
  }

  return { title, link, priceCents, note: text(formData, "note") || null, imageUrl };
}

/** Range une photo envoyée qui ne sert plus. Un échec ne bloque rien. */
async function forgetImage(previous: string | null, current: string | null): Promise<void> {
  if (previous && previous !== current && isStoredImage(previous) && isUploadConfigured()) {
    await del(previous).catch(() => {});
  }
}

export async function addWishAction(
  state: WishFormState,
  formData: FormData,
): Promise<WishFormState> {
  await requireOwner();

  const wish = await readWish(formData);
  if ("error" in wish) return { ...state, error: wish.error };

  await createWish(wish);
  revalidatePath("/ma-liste");
  revalidatePath("/");
  // Le compteur change à chaque ajout : le formulaire s'en sert pour se vider.
  return { ok: (state.ok ?? 0) + 1 };
}

export async function updateWishAction(
  state: WishFormState,
  formData: FormData,
): Promise<WishFormState> {
  await requireOwner();

  const wish = await readWish(formData);
  if ("error" in wish) return { ...state, error: wish.error };

  const result = await updateWish(text(formData, "id"), wish);
  if (result) await forgetImage(result.previousImageUrl, wish.imageUrl);

  revalidatePath("/ma-liste");
  revalidatePath("/");
  redirect("/ma-liste");
}

export async function deleteWishAction(formData: FormData): Promise<void> {
  await requireOwner();
  const id = text(formData, "id");
  if (id) await forgetImage(await deleteWish(id), null);
  revalidatePath("/ma-liste");
  revalidatePath("/");
}

export async function logoutAction(): Promise<void> {
  await closeSession();
  redirect("/");
}
