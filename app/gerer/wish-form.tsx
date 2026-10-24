"use client";

import { useActionState } from "react";

import { addWishAction, type WishFormState } from "./actions";

export function WishForm() {
  const [state, action, pending] = useActionState<WishFormState, FormData>(
    addWishAction,
    {},
  );

  return (
    // La clé change après chaque ajout réussi : les champs repartent à vide.
    <form key={state.ok ?? 0} action={action} className="form">
      <label>
        Envie
        <input name="title" required maxLength={200} />
      </label>
      <label>
        Lien (facultatif)
        <input name="link" inputMode="url" />
      </label>
      <label>
        Prix indicatif en euros (facultatif)
        <input name="price" inputMode="decimal" />
      </label>
      <label>
        Note (facultatif)
        <textarea name="note" rows={2} maxLength={500} />
      </label>
      {state.error ? <p className="error">{state.error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Ajout…" : "Ajouter"}
      </button>
    </form>
  );
}
