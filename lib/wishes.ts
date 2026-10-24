import { query } from "@/lib/db";

export type Wish = {
  id: string;
  title: string;
  link: string | null;
  priceCents: number | null;
  note: string | null;
};

export type WishInput = Omit<Wish, "id">;

type WishRow = {
  id: string;
  title: string;
  link: string | null;
  price_cents: number | null;
  note: string | null;
};

function toWish(row: WishRow): Wish {
  return {
    id: row.id,
    title: row.title,
    link: row.link,
    priceCents: row.price_cents,
    note: row.note,
  };
}

/** Les envies dans l'ordre où elles ont été ajoutées. */
export async function listWishes(): Promise<Wish[]> {
  const rows = await query<WishRow>(
    `select id, title, link, price_cents, note
       from wishes
      order by created_at, id`,
  );
  return rows.map(toWish);
}

export async function createWish(input: WishInput): Promise<Wish> {
  const [row] = await query<WishRow>(
    `insert into wishes (title, link, price_cents, note)
     values ($1, $2, $3, $4)
     returning id, title, link, price_cents, note`,
    [input.title.trim(), input.link, input.priceCents, input.note],
  );
  return toWish(row);
}

export async function deleteWish(id: string): Promise<void> {
  await query(`delete from wishes where id = $1`, [id]);
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
