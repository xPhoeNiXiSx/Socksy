"use server";

import { redirect } from "next/navigation";

import { authenticate } from "@/lib/accounts";
import { openSession } from "@/lib/auth";

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
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Renseigne ton e-mail et ton mot de passe." };
  }

  const user = await authenticate(email, password);
  if (!user) return { error: "E-mail ou mot de passe incorrect." };

  await openSession(user.id);
  redirect(safeNext(formData.get("next")));
}
