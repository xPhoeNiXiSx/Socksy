/**
 * Schéma de Socksy — source unique de vérité.
 *
 * Il vit dans le code pour que l'application l'applique elle-même depuis une
 * fonction serveur (voir `ensureSchema`) : personne n'a à ouvrir un éditeur
 * SQL, ni au premier déploiement ni aux évolutions suivantes.
 *
 * Règle à tenir : chaque instruction doit être rejouable sans erreur sur une
 * base déjà à jour. `if not exists` partout, jamais de `drop`.
 *
 * Une version intermédiaire a connu des comptes par membre de la famille : sa
 * table `users` et la colonne `wishes.owner_id` peuvent subsister en base.
 * Elles ne sont plus lues.
 */
export const SCHEMA_STATEMENTS: string[] = [
  `create table if not exists wishes (
     id          uuid primary key default gen_random_uuid(),
     title       text not null check (length(btrim(title)) > 0),
     link        text,
     -- Prix indicatif en centimes d'euro : jamais d'argent en flottant.
     price_cents integer check (price_cents >= 0),
     note        text,
     created_at  timestamptz not null default now()
   )`,

  // Une réservation au plus par envie. Le propriétaire de la liste ne la lit
  // jamais : seules les requêtes de la vue invité joignent cette table.
  `create table if not exists reservations (
     wish_id    uuid primary key references wishes(id) on delete cascade,
     -- Identifiant de l'invité, gardé en cookie : c'est ce qui lui permet,
     -- à lui seul, d'annuler sa réservation.
     guest_id   text not null,
     guest_name text not null check (length(btrim(guest_name)) > 0),
     created_at timestamptz not null default now()
   )`,
];
