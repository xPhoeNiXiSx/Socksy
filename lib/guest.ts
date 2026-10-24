import { cookies } from "next/headers";

import type { User } from "@/lib/accounts";

/**
 * Identité d'un invité sur une liste partagée. Pas de compte : un identifiant
 * aléatoire et un prénom, gardés en cookie. Un membre de la famille connecté
 * est reconnu par son compte, et réserve sous son propre prénom.
 *
 * L'enjeu est faible (on parle de qui offre quoi) : le cookie n'est pas signé,
 * il sert seulement à retrouver ses propres réservations pour les annuler.
 */

const GUEST_ID_COOKIE = "socksy_guest";
const GUEST_NAME_COOKIE = "socksy_guest_name";
const ONE_YEAR = 60 * 60 * 24 * 365;

export type Guest = { id: string; name: string | null };

export async function currentGuest(user: User | null): Promise<Guest | null> {
  if (user) return { id: `user:${user.id}`, name: user.name };

  const jar = await cookies();
  const id = jar.get(GUEST_ID_COOKIE)?.value;
  if (!id) return null;
  return { id: `guest:${id}`, name: jar.get(GUEST_NAME_COOKIE)?.value ?? null };
}

export async function rememberGuestName(name: string): Promise<void> {
  const jar = await cookies();
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  };
  if (!jar.get(GUEST_ID_COOKIE)) {
    jar.set(GUEST_ID_COOKIE, crypto.randomUUID(), options);
  }
  jar.set(GUEST_NAME_COOKIE, name, options);
}
