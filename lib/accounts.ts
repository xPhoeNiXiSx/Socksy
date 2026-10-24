import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { query } from "@/lib/db";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  length: number,
) => Promise<Buffer>;

export type User = {
  id: string;
  name: string;
  email: string;
  shareToken: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  share_token: string;
};

const USER_COLUMNS = "id, name, email, share_token";

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    shareToken: row.share_token,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Format stocké : `scrypt$<sel>$<clé>`, en base64. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, salt, key] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;

  const expected = Buffer.from(key, "base64");
  const actual = await scrypt(password, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

/** Jeton du lien de partage : impossible à deviner, sans caractère à échapper. */
function newShareToken(): string {
  return randomBytes(12).toString("base64url");
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User | "email_taken"> {
  const rows = await query<UserRow>(
    `insert into users (name, email, password_hash, share_token)
     values ($1, $2, $3, $4)
     on conflict (email) do nothing
     returning ${USER_COLUMNS}`,
    [
      input.name.trim(),
      normalizeEmail(input.email),
      await hashPassword(input.password),
      newShareToken(),
    ],
  );
  return rows[0] ? toUser(rows[0]) : "email_taken";
}

export async function authenticate(
  email: string,
  password: string,
): Promise<User | null> {
  const [row] = await query<UserRow & { password_hash: string }>(
    `select ${USER_COLUMNS}, password_hash from users where email = $1`,
    [normalizeEmail(email)],
  );
  if (!row || !(await verifyPassword(password, row.password_hash))) return null;
  return toUser(row);
}

export async function getUser(id: string): Promise<User | null> {
  const [row] = await query<UserRow>(
    `select ${USER_COLUMNS} from users where id = $1`,
    [id],
  );
  return row ? toUser(row) : null;
}

export async function getUserByShareToken(token: string): Promise<User | null> {
  const [row] = await query<UserRow>(
    `select ${USER_COLUMNS} from users where share_token = $1`,
    [token],
  );
  return row ? toUser(row) : null;
}

/** Les autres membres de la famille, par ordre alphabétique. */
export async function listFamily(exceptId: string): Promise<User[]> {
  const rows = await query<UserRow>(
    `select ${USER_COLUMNS} from users where id <> $1 order by lower(name), id`,
    [exceptId],
  );
  return rows.map(toUser);
}
