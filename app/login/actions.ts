"use server";

import { redirect } from "next/navigation";

import { checkPassword, isAuthConfigured, openSession } from "@/lib/auth";

export type LoginState = { error?: string };

/** N'accepte qu'un chemin interne, pour ne pas servir de redirection ouverte. */
function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/ma-liste";
}

export async function loginAction(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isAuthConfigured()) {
    return { error: "APP_PASSWORD ou AUTH_SECRET manque dans Vercel." };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !checkPassword(password)) {
    return { error: "Mot de passe incorrect." };
  }

  await openSession();
  redirect(safeNext(formData.get("next")));
}
