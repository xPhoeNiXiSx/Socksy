/**
 * Jeton de session signé, sans dépendance à `next/headers` ni à Node : le
 * proxy tourne en amont du rendu et partage cette logique avec les pages.
 *
 * Le jeton porte l'identifiant du compte : `<compte>.<émission>.<signature>`.
 */

export const SESSION_COOKIE = "socksy_session";

/** 60 jours : de quoi couvrir toute la saison des cadeaux. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 60;

/** `true` si la clé de signature des sessions est en place. */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET);
}

export async function signPayload(payload: string): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET n'est pas définie. Ajoute-la dans les variables d'environnement Vercel.",
    );
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Comparaison à temps constant, pour ne pas fuiter le secret octet par octet. */
export function safeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function newToken(userId: string): Promise<string> {
  const payload = `${userId}.${Date.now()}`;
  return `${payload}.${await signPayload(payload)}`;
}

/** L'identifiant du compte si le jeton est valide et frais, sinon `null`. Ne lève jamais. */
export async function readToken(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;

  const [userId, issued, signature] = token.split(".");
  if (!userId || !issued || !signature) return null;

  try {
    if (!safeEquals(signature, await signPayload(`${userId}.${issued}`))) {
      return null;
    }
  } catch {
    return null;
  }

  const age = Date.now() - Number(issued);
  return Number.isFinite(age) && age >= 0 && age < SESSION_MAX_AGE * 1000
    ? userId
    : null;
}
