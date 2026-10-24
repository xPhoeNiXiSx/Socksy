"use client";

import { useActionState } from "react";

import { addWishAction, type WishFormState } from "./actions";

export function WishForm() {
  const [state, action, pending] = useActionState<WishFormState, FormData>(
    addWishAction,
    {},
  );

  return (
    <details className="panel" open={state.ok === undefined ? undefined : true}>
      <summary>+ Ajouter une envie</summary>
      {/* La clé change après chaque ajout réussi : les champs repartent à vide. */}
      <form key={state.ok ?? 0} action={action} className="form">
        <label>
          Envie
          <input name="title" required maxLength={200} placeholder="Un pull tout doux" />
        </label>
        <label>
          Prix indicatif (facultatif)
          <input name="price" inputMode="decimal" placeholder="49,90" />
        </label>
        <label>
          Lien (facultatif)
          <input name="link" inputMode="url" placeholder="https://…" />
        </label>
        <label>
          Note (facultatif)
          <textarea name="note" rows={2} maxLength={500} placeholder="Taille, couleur…" />
        </label>
        {state.error ? <p className="error">{state.error}</p> : null}
        <button type="submit" className="btn block" disabled={pending}>
          {pending ? "Ajout…" : "Ajouter à ma liste"}
        </button>
      </form>
    </details>
  );
}
