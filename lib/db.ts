import { neon } from "@neondatabase/serverless";

import { SCHEMA_STATEMENTS } from "@/lib/schema";

/**
 * Accès Postgres. Une seule fonction `query`, volontairement bas niveau :
 * elle permet de rejouer exactement les mêmes requêtes contre une base de test
 * en mémoire (voir `scripts/test-db.ts`).
 */

export type QueryRunner = <T>(
  text: string,
  params?: unknown[],
) => Promise<T[]>;

let runner: QueryRunner | undefined;
let schemaApplied: Promise<void> | undefined;

/** Permet aux tests d'injecter une base locale à la place de Neon. */
export function setQueryRunner(custom: QueryRunner): void {
  runner = custom;
  schemaApplied = undefined;
}

function neonRunner(): QueryRunner {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL n'est pas définie. Relie la base Neon au projet dans Vercel (Storage).",
    );
  }

  const sql = neon(url);
  return async <T>(text: string, params: unknown[] = []) =>
    (await sql.query(text, params)) as T[];
}

/**
 * Applique le schéma une fois par instance de fonction. Les instructions sont
 * idempotentes ; elles partent une par une parce que le pilote HTTP de Neon
 * refuse les requêtes multi-instructions.
 */
function ensureSchema(run: QueryRunner): Promise<void> {
  schemaApplied ??= (async () => {
    for (const statement of SCHEMA_STATEMENTS) {
      await run(statement);
    }
  })().catch((error) => {
    // Un échec ne doit pas rester en cache : le prochain appel réessaie.
    schemaApplied = undefined;
    throw error;
  });
  return schemaApplied;
}

export async function query<T>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  runner ??= neonRunner();
  await ensureSchema(runner);
  return runner<T>(text, params);
}

/** `true` si une base est configurée, sans tenter de s'y connecter. */
export function isDatabaseConfigured(): boolean {
  return Boolean(runner ?? process.env.DATABASE_URL);
}
