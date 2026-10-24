"use server";

import { revalidatePath } from "next/cache";

import { isOwner } from "@/lib/auth";
import { currentGuest, rememberGuestName } from "@/lib/guest";
import { cancelReservation, reserveWish } from "@/lib/wishes";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function setGuestNameAction(formData: FormData): Promise<void> {
  const name = text(formData, "name").slice(0, 40);
  if (name) await rememberGuestName(name);
  revalidatePath("/");
}

export async function reserveAction(formData: FormData): Promise<void> {
  // Le propriétaire ne réserve pas ses propres cadeaux : ce serait lire,
  // en creux, ce que les autres ont déjà pris.
  if (await isOwner()) return;

  const guest = await currentGuest();
  // Sans prénom connu, pas de réservation : la page demande d'abord qui l'on est.
  if (!guest?.name) return;

  await reserveWish({
    wishId: text(formData, "wishId"),
    guestId: guest.id,
    guestName: guest.name,
  });
  revalidatePath("/");
}

export async function cancelAction(formData: FormData): Promise<void> {
  const guest = await currentGuest();
  if (guest) await cancelReservation(text(formData, "wishId"), guest.id);
  revalidatePath("/");
}
