"use server";

import { redirect } from "next/navigation";

import { createUser } from "@/lib/accounts";
import { openSession } from "@/lib/auth";
import { safeEquals } from "@/lib/session";

export type SignupState = { error?: string };

const MIN_PASSWORD = 8;

/**
 * Inscription réservée à la famille : il faut le code famille, qui n'est
 * autre que `APP_PASSWORD`. Sans lui, n'importe qui trouvant le site
 * pourrait se créer un compte et parcourir les listes.
 */
export async function signupAction(
  _state: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const field = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };

  const familyCode = process.env.APP_PASSWORD;
  if (!familyCode || !safeEquals(field("code").trim(), familyCode)) {
    return { error: "Le code famille n'est pas le bon." };
  }

  const name = field("name").trim();
  if (!name) return { error: "Donne ton prénom." };
  if (name.length > 40) return { error: "Ce prénom est un peu long." };

  const email = field("email").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Cet e-mail n'a pas l'air valide." };
  }

  const password = field("password");
  if (password.length < MIN_PASSWORD) {
    return { error: `Choisis un mot de passe d'au moins ${MIN_PASSWORD} caractères.` };
  }

  const user = await createUser({ name, email, password });
  if (user === "email_taken") {
    return { error: "Un compte existe déjà avec cet e-mail." };
  }

  await openSession(user.id);
  redirect("/ma-liste");
}
