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
import { extractImage, isStoredImage } from "../lib/images";
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
    imageUrl: "https://exemple.fr/pull.jpg",
  });
  assert.equal(pull.title, "Un pull");
  assert.equal(pull.priceCents, 4990);
  assert.equal(pull.imageUrl, "https://exemple.fr/pull.jpg");
  const livre = await createWish({ title: "Un livre", link: null, priceCents: null, note: null, imageUrl: null });
  assert.deepEqual((await listWishes()).map((w) => w.title), ["Un pull", "Un livre"]);

  await assert.rejects(createWish({ title: " ", link: null, priceCents: null, note: null, imageUrl: null }));
  await assert.rejects(createWish({ title: "x", link: null, priceCents: -1, note: null, imageUrl: null }));

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
  assert.equal(await deleteWish(livre.id), null);
  assert.deepEqual((await db.query(`select * from reservations`)).rows, []);
  // La suppression rend l'adresse de la photo, pour la ranger aussi.
  assert.equal(await deleteWish(pull.id), "https://exemple.fr/pull.jpg");
  assert.equal(await deleteWish(pull.id), null);

  // --- Photos depuis la page du lien ----------------------------------------
  const page = "https://boutique.fr/produits/pull?ref=1";
  assert.equal(
    extractImage(`<head><meta property="og:image" content="/img/pull.jpg?w=800&amp;h=800"></head>`, page),
    "https://boutique.fr/img/pull.jpg?w=800&h=800",
  );
  // Attributs dans l'autre ordre, guillemets simples, et préférence à og:image.
  assert.equal(
    extractImage(
      `<meta content='https://cdn.fr/tw.jpg' name='twitter:image'><meta content="https://cdn.fr/og.jpg" property="og:image">`,
      page,
    ),
    "https://cdn.fr/og.jpg",
  );
  assert.equal(extractImage(`<link rel="image_src" href="//cdn.fr/old.png">`, page), "https://cdn.fr/old.png");
  assert.equal(extractImage(`<meta property="og:image" content="javascript:alert(1)">`, page), null);
  assert.equal(extractImage(`<html><head><title>Rien</title></head></html>`, page), null);
  assert.equal(isStoredImage("https://abc.public.blob.vercel-storage.com/envies/x.jpg"), true);
  assert.equal(isStoredImage("https://exemple.fr/pull.jpg"), false);

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
