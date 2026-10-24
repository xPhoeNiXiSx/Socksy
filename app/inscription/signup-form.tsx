"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signupAction, type SignupState } from "./actions";

export function SignupForm() {
  const [state, action, pending] = useActionState<SignupState, FormData>(
    signupAction,
    {},
  );

  return (
    <form action={action} className="panel form">
      <label>
        Prénom
        <input name="name" autoComplete="given-name" maxLength={40} autoFocus required />
      </label>
      <label>
        E-mail
        <input type="email" name="email" autoComplete="email" required />
      </label>
      <label>
        Mot de passe
        <input type="password" name="password" autoComplete="new-password" minLength={8} required />
      </label>
      <label>
        Code famille
        <input name="code" autoComplete="off" required />
      </label>
      {state.error ? <p className="error">{state.error}</p> : null}
      <button type="submit" className="btn block" disabled={pending}>
        {pending ? "Création…" : "Créer ma liste"}
      </button>
      <p className="muted" style={{ margin: 0 }}>
        Déjà un compte ? <Link href="/login">Connecte-toi</Link>
      </p>
    </form>
  );
}
