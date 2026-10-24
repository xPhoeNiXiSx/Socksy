/** Montants en centimes : on ne manipule jamais d'argent en flottant. */

const EUROS = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function formatCents(cents: number): string {
  return EUROS.format(cents / 100);
}

/**
 * Lit une saisie en euros (« 12 », « 12,5 », « 12.50 € ») et la convertit en
 * centimes sans passer par un flottant. `null` si vide, `undefined` si illisible.
 */
export function parseEuros(input: string): number | null | undefined {
  const cleaned = input.replace(/[\s €]/g, "").replace(",", ".");
  if (cleaned === "") return null;

  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return undefined;

  const [, whole, fraction = ""] = match;
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
