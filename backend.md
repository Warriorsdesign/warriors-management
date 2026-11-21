# Warriors Management - Backend Security & Architecture Guidelines

Ce document décrit les règles d'architecture et de sécurité du backend PostgreSQL de Warriors Management. L'application est un SaaS B2B multi-tenant : l'isolation des données entre organisations est une priorité absolue. La même architecture PostgreSQL est utilisée en local et peut être hébergée sur Neon.

## 1. Philosophie de Sécurité (Double Ligne de Défense)
Pour garantir qu'un utilisateur de l'Organisation A ne puisse jamais accéder aux données de l'Organisation B, la sécurité s'articule sur deux niveaux :
1. **Ligne de défense applicative (Code métier) :** Le code doit toujours filtrer explicitement par `organization_id`. Exemple : au lieu d'utiliser `findById(id)`, il faut systématiquement utiliser `findByIdAndOrganizationId(id, orgId)` (ou équivalent selon votre langage/framework).
2. **Ligne de défense physique (Base de données - RLS) :** C'est le filet de sécurité absolu. Même si un développeur oublie de filtrer dans sa requête SQL ou son ORM, la base de données refusera de renvoyer les données grâce au *Row Level Security* de PostgreSQL.

## 2. Row Level Security (RLS) dans PostgreSQL
Toutes les tables métiers (sauf les tables de référence globales comme les rôles) **doivent obligatoirement** :
- Avoir RLS activé (`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`).
- Avoir RLS forcé (`ALTER TABLE table_name FORCE ROW LEVEL SECURITY;`). Cela garantit que même le propriétaire de la table est soumis aux règles de sécurité.
- Avoir une politique stricte (Policy) :
  ```sql
  CREATE POLICY tenant_isolation ON table_name
      USING (organization_id = current_setting('app.org_id', true)::uuid)
      WITH CHECK (organization_id = current_setting('app.org_id', true)::uuid);
  ```
Le `deny-by-default` est de rigueur : si la variable `app.org_id` n'est pas définie dans la session de la base de données, la requête renverra 0 ligne ou échouera.

## 3. ORM et rôles PostgreSQL
Le backend utilise Drizzle ORM (`drizzle-orm/node-postgres`) au-dessus du driver PostgreSQL `pg`. Le schéma TypeScript est défini dans `apps/web/src/lib/db/schema.ts`; les migrations sont conservées dans `apps/web/drizzle/` et les adaptations SQL/RLS dans `apps/web/db/`.

Une seule variable `DATABASE_URL` est nécessaire. Elle utilise le rôle serveur `warriors_admin`, qui dispose des droits globaux nécessaires au Back-Office et aux migrations. `db` sert aux opérations globales réservées au Super Administrateur. `withTenantContext` exécute `SET LOCAL ROLE app_user` avant chaque transaction métier. `app_user` est un rôle `NOLOGIN`, sans `BYPASSRLS`, avec les seuls droits DML nécessaires. Les politiques RLS continuent ainsi à isoler les organisations pour les requêtes métier.

Ne pas ajouter de requête métier en dehors de `withTenantContext` : sans le changement vers `app_user`, la connexion admin pourrait contourner la RLS. Le rôle `warriors_admin` reste une clé serveur privilégiée, jamais exposée au navigateur.

Le script `apps/web/scripts/setup-local-postgres.mjs` provisionne ces rôles en local sans supprimer les données. Sur Neon, créez `warriors_admin`, utilisez son URL poolée dans `DATABASE_URL` et appliquez `db/rls_and_roles.sql` avec ce rôle.

## 4. Transmission du Contexte Locataire (Tenant Context)
Puisque les serveurs maintiennent généralement un pool de connexions (connexions recyclées), la variable `app.org_id` doit être injectée au début de **chaque transaction** ou cycle de requête.
- **JWT :** Le token d'authentification de l'utilisateur contient son `organizationId`.
- **Middleware / Intercepteur :** Un intercepteur global (selon le framework utilisé) doit s'exécuter à l'ouverture de la transaction pour lancer la requête native `SELECT set_config('app.org_id', ?, true)` en base de données.
- **Cycle de vie :** Dès qu'une transaction est ouverte, la base de données sait immédiatement à quelle organisation appartient l'utilisateur. À la fin de la transaction, la variable est réinitialisée par la base ou écrasée à la prochaine transaction.

## 5. Connexion locale et Neon
- Une seule variable d'environnement PostgreSQL est requise : `DATABASE_URL`.
- En local, elle pointe vers PostgreSQL sur `127.0.0.1:5432`.
- Sur Neon, utilisez l'URL poolée (`-pooler`) dans `DATABASE_URL` pour les connexions Vercel. `npm run db:push` retire automatiquement `-pooler` pour joindre l'endpoint direct lors de la synchronisation du schéma; aucune deuxième variable permanente n'est nécessaire.
- Les fichiers SQL manuels peuvent être exécutés avec le même rôle `warriors_admin` en utilisant l'endpoint direct proposé par Neon (hôte sans `-pooler`).
- Pour une base existante migrée depuis Prisma, appliquez une fois `apps/web/db/migrations/2026-11-updated-at-defaults.sql` (ou lancez `npm run db:migrate:compat` depuis `apps/web` avec `DATABASE_URL` configurée). Prisma gérait `updatedAt` côté client; cette migration ajoute des valeurs par défaut PostgreSQL pour que les insertions Drizzle omettant ce champ restent valides.
- Les identifiants restent dans `.env` en local et dans les secrets d'environnement du déploiement. N'inscrivez jamais de mot de passe dans le dépôt.

## 6. Requêtes et migrations Drizzle
- Requêtes tenant : toujours utiliser le `tx` fourni par `withTenantContext` ou `withApiRoute`; ne pas interroger directement `db` pour des données d'organisation.
- Utiliser les opérateurs Drizzle (`eq`, `and`, `inArray`, `ilike`, etc.) plutôt que de concaténer des valeurs SQL. Les expressions `sql` interpolées sont paramétrées.
- `npm run db:generate` crée un fichier de migration depuis `src/lib/db/schema.ts`; `npm run db:push` synchronise explicitement le schéma avec PostgreSQL. Vérifier la migration générée avant de la déployer en production.
- Les données JSON sont typées en TypeScript dans les fonctions métier; PostgreSQL les stocke en `jsonb`.

## 7. Bonnes Pratiques de Développement
1. **Pas de mot de passe dans le code :** Les identifiants (`DB_PASSWORD`, `JWT_SECRET`) sont gérés exclusivement via `.env`.
2. **Stateless :** L'authentification repose sur des cookies `httpOnly` et JWT. Aucune session utilisateur n'est maintenue en mémoire côté serveur.
3. **Contrôle d'accès applicatif :** Les endpoints sensibles nécessitant le rôle Administrateur doivent être protégés par un middleware ou une directive de sécurité stricte.
