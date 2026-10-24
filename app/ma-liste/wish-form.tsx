"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { Wish } from "@/lib/wishes";

import { addWishAction, updateWishAction, type WishFormState } from "./actions";
import { shrinkPhoto } from "./shrink";

/** Réduit la photo choisie, s'il y en a une, avant l'envoi au serveur. */
function withShrunkPhoto(
  send: (state: WishFormState, formData: FormData) => Promise<WishFormState>,
) {
  return async (state: WishFormState, formData: FormData): Promise<WishFormState> => {
    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) {
      try {
        formData.set("photo", await shrinkPhoto(photo));
      } catch {
        return { ...state, error: "Impossible de lire cette photo." };
      }
    }
    return send(state, formData);
  };
}

const submitNew = withShrunkPhoto(addWishAction);
const submitEdit = withShrunkPhoto(updateWishAction);

/** Euros affichés dans le champ prix, sans symbole : « 49,90 ». */
function priceField(cents: number | null): string {
  if (cents === null) return "";
  const euros = Math.floor(cents / 100);
  const rest = cents % 100;
  return rest === 0 ? String(euros) : `${euros},${String(rest).padStart(2, "0")}`;
}

/** Les champs d'une envie, communs à l'ajout et à la modification. */
function WishFields({ wish, uploads }: { wish?: Wish; uploads: boolean }) {
  return (
    <>
      <label>
        Envie
        <input
          name="title"
          required
          maxLength={200}
          placeholder="Un pull tout doux"
          defaultValue={wish?.title}
        />
      </label>
      <label>
        Prix indicatif (facultatif)
        <input
          name="price"
          inputMode="decimal"
          placeholder="49,90"
          defaultValue={priceField(wish?.priceCents ?? null)}
        />
      </label>
      <label>
        Lien (facultatif)
        <input
          name="link"
          inputMode="url"
          placeholder="https://…"
          defaultValue={wish?.link ?? ""}
        />
        <span className="hint">La photo du produit est récupérée depuis le lien.</span>
      </label>
      <label>
        Adresse d&apos;une image (facultatif)
        <input
          name="imageUrl"
          inputMode="url"
          placeholder="https://…/photo.jpg"
          defaultValue={wish?.imageUrl ?? ""}
        />
        <span className="hint">
          Appui long sur une image du web, « Copier l&apos;adresse de l&apos;image », puis
          colle-la ici. Remplace celle du lien.
        </span>
      </label>
      {uploads ? (
        <label>
          Ta photo (facultatif)
          <input type="file" name="photo" accept="image/*" />
          <span className="hint">Remplace toutes les autres.</span>
        </label>
      ) : null}
      <label>
        Note (facultatif)
        <textarea
          name="note"
          rows={2}
          maxLength={500}
          placeholder="Taille, couleur…"
          defaultValue={wish?.note ?? ""}
        />
      </label>
    </>
  );
}

export function WishForm({ uploads }: { uploads: boolean }) {
  const [state, action, pending] = useActionState<WishFormState, FormData>(submitNew, {});

  return (
    <details className="panel" open={state.ok === undefined ? undefined : true}>
      <summary>+ Ajouter une envie</summary>
      {/* La clé change après chaque ajout réussi : les champs repartent à vide. */}
      <form key={state.ok ?? 0} action={action} className="form">
        <WishFields uploads={uploads} />
        {state.error ? <p className="error">{state.error}</p> : null}
        <button type="submit" className="btn block" disabled={pending}>
          {pending ? "Ajout…" : "Ajouter à ma liste"}
        </button>
      </form>
    </details>
  );
}

export function EditWishForm({ wish, uploads }: { wish: Wish; uploads: boolean }) {
  const [state, action, pending] = useActionState<WishFormState, FormData>(submitEdit, {});

  return (
    <form action={action} className="panel form">
      <input type="hidden" name="id" value={wish.id} />
      <WishFields wish={wish} uploads={uploads} />
      <span className="hint">
        Pour reprendre la photo du lien, vide l&apos;adresse de l&apos;image.
      </span>
      {state.error ? <p className="error">{state.error}</p> : null}
      <button type="submit" className="btn block" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
      <Link href="/ma-liste" className="btn plain block">
        Annuler
      </Link>
    </form>
  );
}
