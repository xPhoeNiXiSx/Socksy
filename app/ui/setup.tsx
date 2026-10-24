import { isDatabaseConfigured } from "@/lib/db";
import { isAuthConfigured } from "@/lib/session";

import { TopBar } from "./topbar";

/** Variables d'environnement manquantes pour que les comptes fonctionnent. */
export function missingConfig(): string[] {
  return [
    !isDatabaseConfigured() && "DATABASE_URL",
    !isAuthConfigured() && "AUTH_SECRET",
    !process.env.APP_PASSWORD && "APP_PASSWORD",
  ].filter((name): name is string => Boolean(name));
}

export function SetupScreen({ missing }: { missing: string[] }) {
  return (
    <main className="page">
      <TopBar />
      <div className="panel">
        <h2>Configuration incomplète</h2>
        <p className="muted">
          Il manque dans les variables d&apos;environnement Vercel :{" "}
          {missing.map((name) => (
            <code key={name}>{name} </code>
          ))}
          puis redéploie.
        </p>
      </div>
    </main>
  );
}
