import { cookies } from "next/headers";

import { getUser, type User } from "@/lib/accounts";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  newToken,
  readToken,
} from "@/lib/session";

export { isAuthConfigured } from "@/lib/session";

/**
 * Ouverture et fermeture de session. La porte de `/ma-liste` est fermée par
 * le proxy ; ces fonctions servent aux pages et aux actions serveur, qui
 * vérifient la session elles-mêmes.
 */

export async function openSession(userId: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, await newToken(userId), {
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

/** Le compte connecté, ou `null`. Un compte supprimé entre-temps compte comme déconnecté. */
export async function currentUser(): Promise<User | null> {
  const userId = await readToken((await cookies()).get(SESSION_COOKIE)?.value);
  return userId ? getUser(userId) : null;
}
