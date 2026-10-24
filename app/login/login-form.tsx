"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={action} className="panel form">
      <input type="hidden" name="next" value={next} />
      <label>
        E-mail
        <input type="email" name="email" autoComplete="email" autoFocus required />
      </label>
      <label>
        Mot de passe
        <input type="password" name="password" autoComplete="current-password" required />
      </label>
      {state.error ? <p className="error">{state.error}</p> : null}
      <button type="submit" className="btn block" disabled={pending}>
        {pending ? "Vérification…" : "Se connecter"}
      </button>
      <p className="muted" style={{ margin: 0 }}>
        Pas encore de compte ? <Link href="/inscription">Crée ta liste</Link>
      </p>
    </form>
  );
}
