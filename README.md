# Socksy

Les listes de Noël de la famille, et la surprise gardée.

- **`/`** — l'accueil : créer sa liste ou se connecter
- **`/inscription`** — créer son compte, avec le code famille
- **`/ma-liste`** — ajouter et retirer ses envies, partager son lien, ouvrir
  les listes des autres membres de la famille
- **`/l/<jeton>`** — une liste partagée. On y réserve un cadeau (« Je
  l'offre ») avec son prénom, sans compte. Les autres invités voient qui a
  pris quoi ; le propriétaire de la liste, jamais.

## Variables d'environnement (Vercel)

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Base Postgres Neon, posée par Vercel en reliant la base au projet |
| `AUTH_SECRET` | Clé de signature du cookie de session (`openssl rand -hex 32`) |
| `APP_PASSWORD` | Code famille, demandé à l'inscription |

Le schéma s'applique tout seul au premier accès à la base.

## Développement

```
npm install
npm run dev
npm run typecheck && npm test && npm run build
```
