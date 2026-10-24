/**
 * Vérifie la couche données contre un vrai Postgres, en mémoire (PGlite).
 * Le schéma et les requêtes exécutés ici sont exactement ceux de production :
 * seul le pilote change, via `setQueryRunner`.
 *
 *   npm test
 */

import assert from "node:assert/strict";

import { PGlite } from "@electric-sql/pglite";

import {
  authenticate,
  createUser,
  getUserByShareToken,
  listFamily,
} from "../lib/accounts";
import { daysUntilChristmas } from "../lib/countdown";
import { setQueryRunner } from "../lib/db";
import { formatCents, parseEuros } from "../lib/money";
import { SCHEMA_STATEMENTS } from "../lib/schema";
import { newToken, readToken, safeEquals } from "../lib/session";
import {
  cancelReservation,
  createWish,
  deleteWish,
  listWishes,
  listWishesForGuest,
  normalizeLink,
  reserveWish,
} from "../lib/wishes";

async function main() {
  const db = new PGlite();

  // Base de la première version, mono-utilisateur, avec une envie déjà là :
  // le nouveau schéma doit s'appliquer par-dessus sans erreur.
  await db.query(`create table wishes (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) > 0),
    link text, price_cents integer check (price_cents >= 0), note text,
    created_at timestamptz not null default now())`);
  await db.query(`insert into wishes (title) values ('Ancienne envie')`);

  setQueryRunner(async <T>(text: string, params: unknown[] = []) =>
    (await db.query<T>(text, params)).rows,
  );

  // Le schéma se rejoue sans erreur sur une base déjà à jour.
  for (const statement of SCHEMA_STATEMENTS) await db.query(statement);

  // --- Comptes -------------------------------------------------------------
  const lea = await createUser({ name: " Léa ", email: "Lea@Exemple.fr ", password: "motdepasse" });
  assert.notEqual(lea, "email_taken");
  if (lea === "email_taken") throw new Error("inaccessible");
  assert.equal(lea.name, "Léa");
  assert.equal(lea.email, "lea@exemple.fr");
  assert.equal(
    await createUser({ name: "Autre", email: "LEA@exemple.fr", password: "motdepasse" }),
    "email_taken",
  );

  const marc = await createUser({ name: "Marc", email: "marc@exemple.fr", password: "12345678" });
  if (marc === "email_taken") throw new Error("inaccessible");

  assert.equal((await authenticate("lea@exemple.fr", "motdepasse"))?.id, lea.id);
  assert.equal(await authenticate("lea@exemple.fr", "mauvais"), null);
  assert.equal(await authenticate("personne@exemple.fr", "motdepasse"), null);
  assert.equal((await getUserByShareToken(lea.shareToken))?.id, lea.id);
  assert.equal(await getUserByShareToken("inconnu"), null);
  assert.deepEqual((await listFamily(lea.id)).map((u) => u.name), ["Marc"]);

  // --- Envies ----------------------------------------------------------------
  // L'envie d'avant les comptes n'appartient à personne : elle n'apparaît nulle part.
  assert.deepEqual(await listWishes(lea.id), []);

  const pull = await createWish(lea.id, {
    title: "  Un pull  ",
    link: "https://exemple.fr/pull",
    priceCents: 4990,
    note: "Taille M",
  });
  assert.equal(pull.title, "Un pull");
  const livre = await createWish(lea.id, { title: "Un livre", link: null, priceCents: null, note: null });
  assert.deepEqual((await listWishes(lea.id)).map((w) => w.title), ["Un pull", "Un livre"]);
  assert.deepEqual(await listWishes(marc.id), []);

  // On ne supprime pas l'envie d'un autre.
  await deleteWish(marc.id, pull.id);
  assert.equal((await listWishes(lea.id)).length, 2);

  await assert.rejects(createWish(lea.id, { title: " ", link: null, priceCents: null, note: null }));
  await assert.rejects(createWish(lea.id, { title: "x", link: null, priceCents: -1, note: null }));

  // --- Réservations ----------------------------------------------------------
  const julie = "guest:julie";
  assert.equal(
    await reserveWish({ wishId: pull.id, ownerId: lea.id, guestId: julie, guestName: "Julie" }),
    true,
  );
  // Déjà prise : refusée, et la première réservation tient.
  assert.equal(
    await reserveWish({ wishId: pull.id, ownerId: lea.id, guestId: `user:${marc.id}`, guestName: "Marc" }),
    false,
  );
  // La propriétaire ne peut pas réserver sa propre envie.
  assert.equal(
    await reserveWish({ wishId: livre.id, ownerId: lea.id, guestId: `user:${lea.id}`, guestName: "Léa" }),
    false,
  );
  // Une envie présentée avec le lien d'une autre liste est refusée.
  assert.equal(
    await reserveWish({ wishId: livre.id, ownerId: marc.id, guestId: julie, guestName: "Julie" }),
    false,
  );

  const seenByMarc = await listWishesForGuest(lea.id, `user:${marc.id}`);
  assert.deepEqual(
    seenByMarc.map((w) => [w.title, w.reservedBy, w.mine]),
    [["Un pull", "Julie", false], ["Un livre", null, false]],
  );
  const seenByJulie = await listWishesForGuest(lea.id, julie);
  assert.equal(seenByJulie[0].mine, true);

  // La vue propriétaire ne porte aucune trace des réservations.
  for (const wish of await listWishes(lea.id)) {
    assert.equal("reservedBy" in wish, false);
  }

  // Seule Julie peut annuler sa réservation.
  await cancelReservation(pull.id, `user:${marc.id}`);
  assert.equal((await listWishesForGuest(lea.id, julie))[0].reservedBy, "Julie");
  await cancelReservation(pull.id, julie);
  assert.equal((await listWishesForGuest(lea.id, julie))[0].reservedBy, null);

  // Supprimer une envie emporte sa réservation.
  await reserveWish({ wishId: livre.id, ownerId: lea.id, guestId: julie, guestName: "Julie" });
  await deleteWish(lea.id, livre.id);
  assert.deepEqual((await db.query(`select * from reservations`)).rows, []);

  // --- Montants, liens, compte à rebours ------------------------------------
  assert.equal(parseEuros("24,90"), 2490);
  assert.equal(parseEuros("12 €"), 1200);
  assert.equal(parseEuros("0.1"), 10);
  assert.equal(parseEuros(""), null);
  assert.equal(parseEuros("abc"), undefined);
  assert.equal(parseEuros("1,234"), undefined);
  assert.match(formatCents(2490), /24,90/);

  assert.equal(normalizeLink("exemple.fr"), "https://exemple.fr/");
  assert.equal(normalizeLink(""), null);
  assert.equal(normalizeLink("javascript:alert(1)"), undefined);

  assert.equal(daysUntilChristmas(new Date("2026-12-24T23:30:00Z")), 0); // 23 h 30 UTC le 24 = déjà le 25 à Paris.
  assert.equal(daysUntilChristmas(new Date("2026-12-24T12:00:00Z")), 1);
  assert.equal(daysUntilChristmas(new Date("2026-10-24T12:00:00Z")), 62);
  assert.equal(daysUntilChristmas(new Date("2026-12-26T12:00:00Z")), 364);

  // --- Session ---------------------------------------------------------------
  process.env.AUTH_SECRET = "secret-de-test";
  const token = await newToken(lea.id);
  assert.equal(await readToken(token), lea.id);
  assert.equal(await readToken(`${token}x`), null);
  assert.equal(await readToken(token.replace(lea.id, marc.id)), null);
  assert.equal(await readToken(undefined), null);
  assert.equal(safeEquals("abc", "abd"), false);

  console.log("Tous les tests passent.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
