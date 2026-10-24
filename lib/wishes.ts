import { query } from "@/lib/db";

export type Wish = {
  id: string;
  title: string;
  link: string | null;
  priceCents: number | null;
  note: string | null;
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
};

const WISH_COLUMNS = "w.id, w.title, w.link, w.price_cents, w.note";

function toWish(row: WishRow): Wish {
  return {
    id: row.id,
    title: row.title,
    link: row.link,
    priceCents: row.price_cents,
    note: row.note,
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
    `insert into wishes as w (title, link, price_cents, note)
     values ($1, $2, $3, $4)
     returning ${WISH_COLUMNS}`,
    [input.title.trim(), input.link, input.priceCents, input.note],
  );
  return toWish(row);
}

export async function deleteWish(id: string): Promise<void> {
  await query(`delete from wishes where id = $1`, [id]);
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
