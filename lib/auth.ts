import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  newToken,
  safeEquals,
  verifyToken,
} from "@/lib/session";

export { isAuthConfigured } from "@/lib/session";

/**
 * Authentification volontairement minimale : un mot de passe unique, celui
 * du propriétaire de la liste. Les invités n'en ont pas besoin.
 */

export function checkPassword(candidate: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    throw new Error(
      "APP_PASSWORD n'est pas définie. Ajoute-la dans les variables d'environnement Vercel.",
    );
  }
  return safeEquals(candidate, expected);
}

export async function openSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, await newToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function closeSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** `true` si le propriétaire de la liste est connecté. */
export async function isOwner(): Promise<boolean> {
  return verifyToken((await cookies()).get(SESSION_COOKIE)?.value);
}
