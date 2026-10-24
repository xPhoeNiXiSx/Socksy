import { query } from "@/lib/db";

export type Wish = {
  id: string;
  title: string;
  link: string | null;
  priceCents: number | null;
  note: string | null;
  imageUrl: string | null;
};

export type WishInput = Omit<Wish, "id">;

/** Une envie vue par un invité : il sait si elle est prise, et par qui. */
export type GuestWish = Wish & {
  reservedBy: string | null;
  /** `true` si c'est cet invité-là qui l'a réservée : lui seul peut annuler. */
  mine: boolean;
};

type WishRow = {
  id: string;
  title: string;
  link: string | null;
  price_cents: number | null;
  note: string | null;
  image_url: string | null;
};

const WISH_COLUMNS = "w.id, w.title, w.link, w.price_cents, w.note, w.image_url";

function toWish(row: WishRow): Wish {
  return {
    id: row.id,
    title: row.title,
    link: row.link,
    priceCents: row.price_cents,
    note: row.note,
    imageUrl: row.image_url,
  };
}

/**
 * Les envies telles que les voit le propriétaire de la liste : cette requête
 * ne touche jamais aux réservations, c'est ce qui garde la surprise.
 */
export async function listWishes(): Promise<Wish[]> {
  const rows = await query<WishRow>(
    `select ${WISH_COLUMNS}
       from wishes w
      order by w.created_at, w.id`,
  );
  return rows.map(toWish);
}

/** Une envie, telle que la voit le propriétaire (sans réservation). */
export async function getWish(id: string): Promise<Wish | null> {
  const rows = await query<WishRow>(
    `select ${WISH_COLUMNS} from wishes w where w.id = $1`,
    [id],
  );
  return rows[0] ? toWish(rows[0]) : null;
}

/** Les envies vues par un invité, réservations comprises. */
export async function listWishesForGuest(guestId: string | null): Promise<GuestWish[]> {
  const rows = await query<WishRow & { guest_name: string | null; guest_id: string | null }>(
    `select ${WISH_COLUMNS}, r.guest_name, r.guest_id
       from wishes w
       left join reservations r on r.wish_id = w.id
      order by w.created_at, w.id`,
  );
  return rows.map((row) => ({
    ...toWish(row),
    reservedBy: row.guest_name,
    mine: guestId !== null && row.guest_id === guestId,
  }));
}

export async function createWish(input: WishInput): Promise<Wish> {
  const [row] = await query<WishRow>(
    `insert into wishes as w (title, link, price_cents, note, image_url)
     values ($1, $2, $3, $4, $5)
     returning ${WISH_COLUMNS}`,
    [input.title.trim(), input.link, input.priceCents, input.note, input.imageUrl],
  );
  return toWish(row);
}

/**
 * Remplace le contenu d'une envie. Renvoie l'adresse de la photo d'avant,
 * pour la ranger si elle a changé ; `undefined` si l'envie n'existe plus.
 */
export async function updateWish(
  id: string,
  input: WishInput,
): Promise<{ previousImageUrl: string | null } | undefined> {
  const rows = await query<{ previous_image_url: string | null }>(
    `update wishes w
        set title = $2, link = $3, price_cents = $4, note = $5, image_url = $6
       from (select id, image_url from wishes where id = $1) before
      where w.id = before.id
      returning before.image_url as previous_image_url`,
    [id, input.title.trim(), input.link, input.priceCents, input.note, input.imageUrl],
  );
  return rows[0] ? { previousImageUrl: rows[0].previous_image_url } : undefined;
}

/** Supprime l'envie et renvoie l'adresse de sa photo, pour la ranger aussi. */
export async function deleteWish(id: string): Promise<string | null> {
  const rows = await query<{ image_url: string | null }>(
    `delete from wishes where id = $1 returning image_url`,
    [id],
  );
  return rows[0]?.image_url ?? null;
}

/** Réserve une envie pour un invité. `false` si elle est déjà prise ou n'existe pas. */
export async function reserveWish(input: {
  wishId: string;
  guestId: string;
  guestName: string;
}): Promise<boolean> {
  const rows = await query<{ wish_id: string }>(
    `insert into reservations (wish_id, guest_id, guest_name)
     select w.id, $2, $3 from wishes w where w.id = $1
     on conflict (wish_id) do nothing
     returning wish_id`,
    [input.wishId, input.guestId, input.guestName.trim()],
  );
  return rows.length > 0;
}

/** Seul l'invité qui a réservé peut annuler. */
export async function cancelReservation(wishId: string, guestId: string): Promise<void> {
  await query(`delete from reservations where wish_id = $1 and guest_id = $2`, [
    wishId,
    guestId,
  ]);
}

/** N'accepte que les liens http(s), pour ne jamais rendre un `javascript:`. */
export function normalizeLink(input: string): string | null | undefined {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
