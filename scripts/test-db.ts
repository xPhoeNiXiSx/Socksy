/**
 * Vérifie la couche données contre un vrai Postgres, en mémoire (PGlite).
 * Le schéma et les requêtes exécutés ici sont exactement ceux de production :
 * seul le pilote change, via `setQueryRunner`.
 *
 *   npm test
 */

import assert from "node:assert/strict";

import { PGlite } from "@electric-sql/pglite";

import { daysUntilChristmas } from "../lib/countdown";
import { setQueryRunner } from "../lib/db";
import { formatCents, parseEuros } from "../lib/money";
import { SCHEMA_STATEMENTS } from "../lib/schema";
import { newToken, safeEquals, verifyToken } from "../lib/session";
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

  // Base laissée par la version à comptes : table `users` et colonne
  // `owner_id`. Le schéma actuel doit s'appliquer par-dessus sans erreur, et
  // les envies déjà saisies doivent rester visibles.
  await db.query(`create table users (id uuid primary key default gen_random_uuid(), name text not null)`);
  await db.query(`create table wishes (
    id uuid primary key default gen_random_uuid(),
    title text not null check (length(btrim(title)) > 0),
    link text, price_cents integer check (price_cents >= 0), note text,
    created_at timestamptz not null default now(),
    owner_id uuid references users(id) on delete cascade)`);
  const [{ id: ownerId }] = (
    await db.query<{ id: string }>(`insert into users (name) values ('Moi') returning id`)
  ).rows;
  await db.query(`insert into wishes (title, owner_id) values ('Envie déjà saisie', $1)`, [ownerId]);

  setQueryRunner(async <T>(text: string, params: unknown[] = []) =>
    (await db.query<T>(text, params)).rows,
  );

  // Le schéma se rejoue sans erreur sur une base déjà à jour.
  for (const statement of SCHEMA_STATEMENTS) await db.query(statement);
  for (const statement of SCHEMA_STATEMENTS) await db.query(statement);

  assert.deepEqual((await listWishes()).map((w) => w.title), ["Envie déjà saisie"]);
  await db.query(`delete from wishes`);

  // --- Envies ----------------------------------------------------------------
  const pull = await createWish({
    title: "  Un pull  ",
    link: "https://exemple.fr/pull",
    priceCents: 4990,
    note: "Taille M",
  });
  assert.equal(pull.title, "Un pull");
  assert.equal(pull.priceCents, 4990);
  const livre = await createWish({ title: "Un livre", link: null, priceCents: null, note: null });
  assert.deepEqual((await listWishes()).map((w) => w.title), ["Un pull", "Un livre"]);

  await assert.rejects(createWish({ title: " ", link: null, priceCents: null, note: null }));
  await assert.rejects(createWish({ title: "x", link: null, priceCents: -1, note: null }));

  // --- Réservations ----------------------------------------------------------
  const julie = "julie";
  const marc = "marc";
  assert.equal(await reserveWish({ wishId: pull.id, guestId: julie, guestName: "Julie" }), true);
  // Déjà prise : refusée, et la première réservation tient.
  assert.equal(await reserveWish({ wishId: pull.id, guestId: marc, guestName: "Marc" }), false);
  // Une envie inconnue est refusée.
  assert.equal(
    await reserveWish({
      wishId: "00000000-0000-0000-0000-000000000000",
      guestId: marc,
      guestName: "Marc",
    }),
    false,
  );

  const seenByMarc = await listWishesForGuest(marc);
  assert.deepEqual(
    seenByMarc.map((w) => [w.title, w.reservedBy, w.mine]),
    [["Un pull", "Julie", false], ["Un livre", null, false]],
  );
  assert.equal((await listWishesForGuest(julie))[0].mine, true);
  assert.equal((await listWishesForGuest(null))[0].mine, false);

  // La vue du propriétaire ne porte aucune trace des réservations.
  for (const wish of await listWishes()) {
    assert.equal("reservedBy" in wish, false);
  }

  // Seule Julie peut annuler sa réservation.
  await cancelReservation(pull.id, marc);
  assert.equal((await listWishesForGuest(julie))[0].reservedBy, "Julie");
  await cancelReservation(pull.id, julie);
  assert.equal((await listWishesForGuest(julie))[0].reservedBy, null);

  // Supprimer une envie emporte sa réservation.
  await reserveWish({ wishId: livre.id, guestId: julie, guestName: "Julie" });
  await deleteWish(livre.id);
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
  const token = await newToken();
  assert.equal(await verifyToken(token), true);
  assert.equal(await verifyToken(`${token}x`), false);
  assert.equal(await verifyToken(undefined), false);
  assert.equal(safeEquals("abc", "abd"), false);

  console.log("Tous les tests passent.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
