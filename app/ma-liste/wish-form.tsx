"use client";

import { useActionState } from "react";

import { addWishAction, type WishFormState } from "./actions";
import { shrinkPhoto } from "./shrink";

/** Réduit la photo choisie, s'il y en a une, puis envoie au serveur. */
async function submitWish(state: WishFormState, formData: FormData): Promise<WishFormState> {
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      formData.set("photo", await shrinkPhoto(photo));
    } catch {
      return { ...state, error: "Impossible de lire cette photo." };
    }
  }
  return addWishAction(state, formData);
}

export function WishForm({ uploads }: { uploads: boolean }) {
  const [state, action, pending] = useActionState<WishFormState, FormData>(submitWish, {});

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
          <span className="hint">La photo du produit est récupérée depuis le lien.</span>
        </label>
        {uploads ? (
          <label>
            Ta photo (facultatif)
            <input type="file" name="photo" accept="image/*" />
            <span className="hint">Remplace celle du lien.</span>
          </label>
        ) : null}
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
