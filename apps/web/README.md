## Développement local

Prérequis : Node.js, npm et PostgreSQL installé et démarré.

Depuis `apps/web`, configurez la base et appliquez le schéma :

```bash
npm install
npm run db:setup:local
npm run dev
```

Le script demande l'autorisation `sudo` pour créer les rôles PostgreSQL et la base
`warriors_management`. Il refuse d'utiliser une base ou des rôles préexistants si
le `.env` local ne contient pas déjà leurs identifiants correspondants. Les URL de
connexion et une nouvelle clé JWT sont écrites dans `.env` avec des permissions
réservées à l'utilisateur courant.

Le schéma de référence reste `prisma/schema.prisma`. Les scripts SQL historiques
dans `prisma/migrations-sql/` sont conservés; sur une base locale neuve, le script
applique le schéma Prisma courant puis configure les politiques RLS.

Pour héberger la base sur Neon ultérieurement, remplacez uniquement `DATABASE_URL`
par l'URL de connexion applicative et `DIRECT_URL` par l'URL directe de migration
et d'administration. Le code Prisma et le schéma restent inchangés.

## Commandes utiles

- `npm run db:push` : synchronise le schéma Prisma vers la base configurée.
- `npm run db:seed:plans` : insère ou met à jour les forfaits initiaux.
- `npm run dev` : démarre l'application sur http://localhost:3000.
