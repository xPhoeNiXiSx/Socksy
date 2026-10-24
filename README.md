# Socksy

Ma liste de Noël, et la surprise gardée.

- **`/`** — la liste, ouverte à tous ceux qui ont le lien. On y réserve un
  cadeau (« Je l'offre ») avec son prénom, sans compte. Les invités voient
  qui a pris quoi ; le propriétaire de la liste, jamais.
- **`/ma-liste`** — ajouter et retirer des envies, copier le lien à partager.
  Protégé par le mot de passe `APP_PASSWORD`.

## Variables d'environnement (Vercel)

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Base Postgres Neon, posée par Vercel en reliant la base au projet |
| `APP_PASSWORD` | Mot de passe pour gérer la liste |
| `AUTH_SECRET` | Clé de signature du cookie de session (`openssl rand -hex 32`) |
| `OWNER_NAME` | Facultatif : le prénom affiché en tête de liste |

Le schéma s'applique tout seul au premier accès à la base.

## Développement

```
npm install
npm run dev
npm run typecheck && npm test && npm run build
```
