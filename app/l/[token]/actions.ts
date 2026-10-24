"use server";

import { revalidatePath } from "next/cache";

import { getUserByShareToken } from "@/lib/accounts";
import { currentUser } from "@/lib/auth";
import { currentGuest, rememberGuestName } from "@/lib/guest";
import { cancelReservation, reserveWish } from "@/lib/wishes";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function setGuestNameAction(formData: FormData): Promise<void> {
  const name = text(formData, "name").slice(0, 40);
  if (name) await rememberGuestName(name);
  revalidatePath(`/l/${text(formData, "token")}`);
}

export async function reserveAction(formData: FormData): Promise<void> {
  const token = text(formData, "token");
  const owner = await getUserByShareToken(token);
  const guest = await currentGuest(await currentUser());
  // Sans prénom connu, pas de réservation : la page demande d'abord qui l'on est.
  if (!owner || !guest?.name) return;

  await reserveWish({
    wishId: text(formData, "wishId"),
    ownerId: owner.id,
    guestId: guest.id,
    guestName: guest.name,
  });
  revalidatePath(`/l/${token}`);
}

export async function cancelAction(formData: FormData): Promise<void> {
  const guest = await currentGuest(await currentUser());
  if (guest) await cancelReservation(text(formData, "wishId"), guest.id);
  revalidatePath(`/l/${text(formData, "token")}`);
}
