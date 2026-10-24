/**
 * Schéma de la liste — source unique de vérité.
 *
 * Il vit dans le code pour que l'application l'applique elle-même depuis une
 * fonction serveur (voir `ensureSchema`) : personne n'a à ouvrir un éditeur
 * SQL, ni au premier déploiement ni aux évolutions suivantes.
 *
 * Règle à tenir : chaque instruction doit être rejouable sans erreur sur une
 * base déjà à jour. `if not exists` partout, jamais de `drop`.
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
];
