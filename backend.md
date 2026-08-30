# Warriors Management - Backend Security & Architecture Guidelines

Ce document décrit les règles strictes d'architecture et de sécurité à respecter lors du développement du backend (PostgreSQL / Supabase) de l'application Warriors Management. L'application étant un SaaS B2B multi-tenant, l'isolation des données entre les différentes organisations clientes est la priorité absolue, **quelle que soit la technologie backend utilisée (Node.js, Python, Java, Go, etc.)**.

## 1. Philosophie de Sécurité (Double Ligne de Défense)
Pour garantir qu'un utilisateur de l'Organisation A ne puisse jamais accéder aux données de l'Organisation B, la sécurité s'articule sur deux niveaux :
1. **Ligne de défense applicative (Code métier) :** Le code doit toujours filtrer explicitement par `organization_id`. Exemple : au lieu d'utiliser `findById(id)`, il faut systématiquement utiliser `findByIdAndOrganizationId(id, orgId)` (ou équivalent selon votre langage/framework).
2. **Ligne de défense physique (Base de données - RLS) :** C'est le filet de sécurité absolu. Même si un développeur oublie de filtrer dans sa requête SQL ou son ORM, la base de données refusera de renvoyer les données grâce au *Row Level Security* de PostgreSQL.

## 2. Row Level Security (RLS) dans Supabase
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

## 3. Gestion des Rôles PostgreSQL
L'application ne doit **jamais** se connecter à la base de données avec le rôle `postgres` ou le rôle `service_role` de Supabase, car ces rôles contournent le RLS.

Trois rôles distincts doivent être utilisés :
1. **`app_migrator`** : 
   - **Rôle :** Exécuter les migrations de base de données (Flyway).
   - **Privilèges :** Propriétaire des tables, droit de CREATE.
   - **Usage :** Uniquement pendant le démarrage de l'application via Flyway.
2. **`app_user`** :
   - **Rôle :** Effectuer les requêtes métiers quotidiennes via le backend applicatif.
   - **Privilèges :** Uniquement `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
   - **Contrainte :** Soumis strictement au RLS. N'a accès aux données qu'après que l'application ait injecté l'`org_id`.
3. **`app_auth`** :
   - **Rôle :** Gérer spécifiquement la connexion utilisateur (Login).
   - **Privilèges :** Lecture seule sur la table `users` avec une politique RLS dédiée qui l'autorise à tout lire (car lors de la connexion, l'organisation de l'utilisateur n'est pas encore connue).
   - **Usage :** Uniquement pour le module d'authentification avec une connexion/DataSource secondaire spécifique.

## 4. Transmission du Contexte Locataire (Tenant Context)
Puisque les serveurs maintiennent généralement un pool de connexions (connexions recyclées), la variable `app.org_id` doit être injectée au début de **chaque transaction** ou cycle de requête.
- **JWT :** Le token d'authentification de l'utilisateur contient son `organizationId`.
- **Middleware / Intercepteur :** Un intercepteur global (selon le framework utilisé) doit s'exécuter à l'ouverture de la transaction pour lancer la requête native `SELECT set_config('app.org_id', ?, true)` en base de données.
- **Cycle de vie :** Dès qu'une transaction est ouverte, la base de données sait immédiatement à quelle organisation appartient l'utilisateur. À la fin de la transaction, la variable est réinitialisée par la base ou écrasée à la prochaine transaction.

## 5. Connexion via Supavisor (Pooler Supabase)
Supabase utilisant IPv6 en natif, toutes les connexions doivent se faire via le **Pooler de connexion (Supavisor)** :
- Port **6543** (Mode Transaction) : Pour `app_user` et `app_auth` (car le backend utilise un pooler de connexions côté serveur).
- Port **5432 du pooler** (Mode Session) : Exclusivement pour `app_migrator` (si votre outil de migration comme Flyway requiert des advisory locks impossibles en mode transaction).
- Format du login : Le nom d'utilisateur dans le `.env` doit suivre le format `role.project_ref` (ex: `app_user.nwfceqwlumteiqsyfopt`).

## 6. Bonnes Pratiques de Développement
1. **Pas de mot de passe dans le code :** Les identifiants (`DB_PASSWORD`, `JWT_SECRET`) sont gérés exclusivement via `.env`.
2. **Stateless :** L'authentification repose sur des cookies `httpOnly` et JWT. Aucune session utilisateur n'est maintenue en mémoire côté serveur.
3. **Contrôle d'accès applicatif :** Les endpoints sensibles nécessitant le rôle Administrateur doivent être protégés par un middleware ou une directive de sécurité stricte.
