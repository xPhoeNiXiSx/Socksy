import { Hero } from "./hero";

/**
 * Le bandeau de la liste. Le prénom vient de `OWNER_NAME` (facultatif) :
 * sans lui, le bandeau reste générique.
 */
export function ListHero() {
  const name = process.env.OWNER_NAME?.trim();
  return name ? (
    <Hero kicker="La liste de Noël de" title={name} />
  ) : (
    <Hero kicker="Noël" title="Ma liste" />
  );
}
