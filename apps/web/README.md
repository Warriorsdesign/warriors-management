# Warriors Management

## Développement local

Prérequis : Node.js, npm et PostgreSQL installé et démarré.

Depuis `apps/web`, configurez la base et démarrez l'application :

```bash
npm install
npm run db:setup:local
npm run dev
```

Le script `db:setup:local` demande `sudo` pour provisionner PostgreSQL. Il refuse
de modifier une base ou des rôles préexistants si le `.env` ne contient pas déjà
les identifiants locaux correspondants. Il met à jour le rôle applicatif, applique
le schéma Drizzle, corrige les valeurs par défaut `updatedAt`, applique les
politiques RLS et initialise les forfaits. Le script écrit uniquement
`DATABASE_URL` et `JWT_SECRET` dans `.env` et ne supprime aucune donnée.

## Couche de données

Le backend utilise **Drizzle ORM + `pg`**. Le schéma TypeScript est défini dans
[`src/lib/db/schema.ts`](./src/lib/db/schema.ts), le pool PostgreSQL et les
transactions sont gérés dans [`src/lib/db/index.ts`](./src/lib/db/index.ts).
L'interface utilisateur et les contrats des API ne dépendent pas de l'ORM.

La seule variable d'environnement PostgreSQL est `DATABASE_URL`. En local, elle
utilise le rôle `warriors_admin`. Sur Neon/Vercel, configurez l'URL poolée
(`-pooler`) de ce rôle. Les accès métier passent par `withTenantContext`, qui
applique `SET LOCAL ROLE app_user` et le contexte RLS dans une même transaction.
Les opérations globales du Back-Office utilisent le rôle serveur privilégié.
Ne pas exposer `DATABASE_URL` au navigateur.

Les évolutions de schéma :

```bash
npm run db:generate
npm run db:push
```

`db:generate` crée une migration SQL versionnée dans `drizzle/` depuis le schéma
TypeScript. `db:push` applique les changements au PostgreSQL configuré et dérive
l'endpoint direct depuis l'hôte Neon poolé. Relisez la migration et sauvegardez
la base avant tout changement en production. Les scripts SQL spécifiques et
historiques sont conservés dans `db/migrations/`; les règles RLS sont dans
`db/rls_and_roles.sql`.

## Migration Prisma vers Drizzle

Prisma a été retiré du runtime et des scripts. Le schéma PostgreSQL existant est
conservé (tables, colonnes, relations, contraintes et types); les migrations SQL
historiques ont été déplacées de `prisma/migrations-sql/` vers `db/migrations/`.
Le premier fichier Drizzle sert de référence SQL versionnée pour les installations
neuves. Il ne faut pas rejouer ce baseline sur une base déjà initialisée.

La migration ne réinitialise pas les données. Sur une base existante, exécutez
`npm run db:setup:local` en local ou appliquez les instructions correspondant à
votre hébergeur après sauvegarde. Pour Neon, le schéma, les migrations SQL et les
politiques RLS doivent être appliqués avant le déploiement recevant du trafic.

## Variables d'environnement

Copiez [`.env.example`](./.env.example) en `.env` seulement si vous configurez
l'environnement manuellement. Gardez les secrets hors de Git. La clé `JWT_SECRET`
doit être propre à chaque environnement et générée indépendamment des mots de
passe PostgreSQL.

## Commandes utiles

- `npm run db:setup:local` : prépare une base locale sans supprimer une base existante.
- `npm run db:generate` : génère une migration Drizzle.
- `npm run db:push` : synchronise le schéma avec PostgreSQL.
- `npm run db:migrate:compat` : applique les valeurs par défaut `updatedAt`
  nécessaires aux bases créées précédemment avec Prisma.
- `npm run db:seed:plans` : insère ou met à jour les forfaits initiaux.
- `npm run db:studio` : ouvre Drizzle Studio.
- `npm run build` : génère le build Next.js sans étape de génération Prisma.
- `npm run dev` : démarre l'application sur http://localhost:3000.
