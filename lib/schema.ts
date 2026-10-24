/**
 * Schéma de Socksy — source unique de vérité.
 *
 * Il vit dans le code pour que l'application l'applique elle-même depuis une
 * fonction serveur (voir `ensureSchema`) : personne n'a à ouvrir un éditeur
 * SQL, ni au premier déploiement ni aux évolutions suivantes.
 *
 * Règle à tenir : chaque instruction doit être rejouable sans erreur sur une
 * base déjà à jour. `if not exists` partout, jamais de `drop`.
 */
export const SCHEMA_STATEMENTS: string[] = [
  // Un compte par membre de la famille, et une liste par compte : le lien de
  // partage de la liste vit donc directement sur le compte.
  `create table if not exists users (
     id            uuid primary key default gen_random_uuid(),
     name          text not null check (length(btrim(name)) > 0),
     -- Toujours enregistré en minuscules : la connexion ne dépend pas de la casse.
     email         text not null unique,
     password_hash text not null,
     share_token   text not null unique,
     created_at    timestamptz not null default now()
   )`,

  `create table if not exists wishes (
     id          uuid primary key default gen_random_uuid(),
     title       text not null check (length(btrim(title)) > 0),
     link        text,
     -- Prix indicatif en centimes d'euro : jamais d'argent en flottant.
     price_cents integer check (price_cents >= 0),
     note        text,
     created_at  timestamptz not null default now()
   )`,

  // Ajoutée après la première version, mono-utilisateur : les envies créées
  // avant les comptes n'ont pas de propriétaire et n'apparaissent nulle part.
  `alter table wishes
     add column if not exists owner_id uuid references users(id) on delete cascade`,

  `create index if not exists wishes_owner_idx on wishes (owner_id, created_at)`,

  // Une réservation au plus par envie. Le propriétaire de la liste ne la lit
  // jamais : seules les requêtes de la vue invité joignent cette table.
  `create table if not exists reservations (
     wish_id    uuid primary key references wishes(id) on delete cascade,
     -- Identifiant de l'invité (cookie, ou compte s'il est connecté) : c'est
     -- ce qui lui permet, à lui seul, d'annuler sa réservation.
     guest_id   text not null,
     guest_name text not null check (length(btrim(guest_name)) > 0),
     created_at timestamptz not null default now()
   )`,
];
