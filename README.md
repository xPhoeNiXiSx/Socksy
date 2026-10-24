# Socksy

Ma liste de Noël : ce qui me ferait plaisir, à partager avec mes proches.

- **`/`** — la liste, en lecture, ouverte à tous
- **`/gerer`** — ajouter et retirer des envies, derrière un mot de passe

## Variables d'environnement (Vercel)

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Base Postgres Neon, posée par Vercel en reliant la base au projet |
| `APP_PASSWORD` | Mot de passe de la page de gestion |
| `AUTH_SECRET` | Clé de signature du cookie de session (`openssl rand -hex 32`) |

Le schéma s'applique tout seul au premier accès à la base.

## Développement

```
npm install
npm run dev
npm run typecheck && npm test && npm run build
```
