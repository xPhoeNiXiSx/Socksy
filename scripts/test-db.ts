/**
 * Vérifie la couche données contre un vrai Postgres, en mémoire (PGlite).
 * Le schéma et les requêtes exécutés ici sont exactement ceux de production :
 * seul le pilote change, via `setQueryRunner`.
 *
 *   npm test
 */

import assert from "node:assert/strict";

import { PGlite } from "@electric-sql/pglite";

import { setQueryRunner } from "../lib/db";
import { formatCents, parseEuros } from "../lib/money";
import { SCHEMA_STATEMENTS } from "../lib/schema";
import { newToken, safeEquals, verifyToken } from "../lib/session";
import { createWish, deleteWish, listWishes, normalizeLink } from "../lib/wishes";

async function main() {
  const db = new PGlite();
  setQueryRunner(async <T>(text: string, params: unknown[] = []) =>
    (await db.query<T>(text, params)).rows,
  );

  // Le schéma se rejoue sans erreur sur une base déjà à jour.
  for (const statement of SCHEMA_STATEMENTS) await db.query(statement);
  for (const statement of SCHEMA_STATEMENTS) await db.query(statement);

  // Ajout, ordre d'ajout, suppression.
  assert.deepEqual(await listWishes(), []);
  const first = await createWish({
    title: "  Un pull  ",
    link: "https://exemple.fr/pull",
    priceCents: 4990,
    note: "Taille M",
  });
  assert.equal(first.title, "Un pull");
  assert.equal(first.priceCents, 4990);
  await createWish({ title: "Un livre", link: null, priceCents: null, note: null });
  assert.deepEqual(
    (await listWishes()).map((wish) => wish.title),
    ["Un pull", "Un livre"],
  );
  await deleteWish(first.id);
  assert.deepEqual((await listWishes()).map((wish) => wish.title), ["Un livre"]);

  // La base refuse un titre vide et un prix négatif.
  await assert.rejects(createWish({ title: " ", link: null, priceCents: null, note: null }));
  await assert.rejects(createWish({ title: "x", link: null, priceCents: -1, note: null }));

  // Montants en centimes, sans flottant.
  assert.equal(parseEuros("24,90"), 2490);
  assert.equal(parseEuros("12 €"), 1200);
  assert.equal(parseEuros("0.1"), 10);
  assert.equal(parseEuros(""), null);
  assert.equal(parseEuros("abc"), undefined);
  assert.equal(parseEuros("1,234"), undefined);
  assert.match(formatCents(2490), /24,90/);

  // Liens : http(s) uniquement.
  assert.equal(normalizeLink("exemple.fr"), "https://exemple.fr/");
  assert.equal(normalizeLink(""), null);
  assert.equal(normalizeLink("javascript:alert(1)"), undefined);

  // Session : un jeton signé passe, un jeton altéré non.
  process.env.AUTH_SECRET = "secret-de-test";
  const token = await newToken();
  assert.equal(await verifyToken(token), true);
  assert.equal(await verifyToken(`${token}x`), false);
  assert.equal(safeEquals("abc", "abd"), false);

  console.log("Tous les tests passent.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
