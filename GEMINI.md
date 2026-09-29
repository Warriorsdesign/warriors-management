# Warriors Management - AI Assistant Guide

Ce fichier sert de documentation centrale et de directives pour les modèles d'IA (Gemini/Antigravity) intervenant sur le projet **Warriors Management**. Il doit être lu en début de contexte pour comprendre l'architecture, l'état d'avancement et les règles strictes de conception dictées par l'utilisateur.

## 1. Ce que fait l'application
**Warriors Management** est une application web de type ERP/Dashboard destinée à la gestion complète de centres de formation. Elle permet aux administrateurs de piloter l'ensemble de leur activité : gestion des étudiants, des inscriptions (classes et formations), de la facturation et trésorerie (paiements des frais de scolarité, gestion des dépenses) et du paramétrage de l'organisation. L'objectif est d'offrir une interface ultra-rapide, moderne, réactive et épurée.

## 2. Fonctionnalités implémentées (État actuel)
- **Tableau de bord (Overview) :** KPIs globaux, indicateurs de trésorerie (Reste à encaisser), statistiques sur les étudiants (Actifs, Nouveaux, Diplômés, Abandons), listes des paiements récents/en retard, et graphiques d'évolution.
- **Étudiants :** Listing paginé avec barre de recherche, filtres. Informations détaillées (statut, matricule). Navigation rapide entre étudiants via boutons `Précédent`/`Suivant`. Génération de reçus PDF.
- **Formations & Classes :** Gestion des programmes et des cohortes. Le statut des classes (`Ouverte` ou `Complète`) est calculé dynamiquement.
- **Paiements :** Historique des encaissements, suivi des échéanciers.
- **Dépenses :** Module CRUD complet (Ajout, Édition, Suppression) avec persistances locales.
- **Centres & Utilisateurs :** Vues en liste avec barre de recherche animée.
- **Rapports :** Vues analytiques (Général, Formations) avec graphiques interactifs (Recharts) et sélecteurs de dates.
- **Paramètres :** Configuration de l'organisation (Nom, Adresse, Téléphone, Email) et du profil utilisateur. Upload dynamique d'avatars et logos avec synchronisation globale en temps réel (TopBar / NavBar).
- **Notifications :** Remplacement des alertes natives par un système de **Toast** global (via Zustand) pour des feedbacks élégants.
- **Animations :** Tous les formulaires/modales bénéficient d'animations `fade-in-up` intégrées nativement via Tailwind CSS.

## 3. Structure des fichiers
Le projet suit l'architecture standard **Next.js (App Router)** au sein d'un monorepo :
- `apps/web/src/app/` : Contient les différentes routes et pages de l'application (`/`, `/students`, `/classes`, `/payments`, `/expenses`, `/reports`, `/settings`, `/centers`, `/users`, `/formations`).
- `apps/web/src/components/` : Composants réutilisables.
  - `layout/` : Composants structurels (`sidebar.tsx`, `topbar.tsx`).
  - `ui/` : Composants visuels de base (`card.tsx`, `modal.tsx`, `toast.tsx`, `date-picker.tsx`, `select.tsx`, `badge.tsx`, `receipt-modal.tsx`).
- `apps/web/src/lib/` : Utilitaires et gestion d'état.
  - `store/` : Stores Zustand (`useUIStore.ts` pour gérer l'état UI dont les Toasts).
  - `data/mockData.ts` : Source de vérité actuelle contenant toutes les interfaces TypeScript et les données mockées initiales.

## 4. Technologies utilisées
- **Framework :** Next.js (App Router, React, TypeScript).
- **Styling :** Tailwind CSS.
- **Icônes :** Lucide React.
- **Graphiques :** Recharts.
- **Gestion d'état :** Zustand.
- **Persistance des données :** `localStorage` (clé principale `warriors_mock_*` pour simuler une base de données en mode client).
- **Génération PDF :** `react-to-print` (ou impression native du navigateur).

## 5. Base de données : Tables nécessaires pour le backend
Afin de rendre cette application 100% fonctionnelle avec un vrai backend, la base de données devra implémenter les tables suivantes (basées sur `mockData.ts`) :

1. **Organization** : ID, Nom, Logo URL, Email, Téléphone, Adresse.
2. **Center** : ID, Nom, Adresse, Statut (actif/inactif), OrganizationId.
3. **User** (Employés) : ID, Prénom, Nom, Email, Rôle, Statut, CenterIds (relation plusieurs-à-plusieurs).
4. **Formation** : ID, Nom, Durée, Indicateur niveaux multiples, Nombre de niveaux, Coût total, Statut.
5. **ClassGroup** (Cohorte) : ID, Nom, FormationId, CenterId, Capacité, Statut (ouverte/complète/cloturée), Dates début/fin.
6. **Student** : ID, Matricule, Prénom, Nom, Contact, Email, Genre, Statut actuel, Niveau actuel, ClassId, Date inscription. (Peut inclure une table fille pour les Logs de Progression).
7. **PaymentSchedule** (Échéancier) : ID, StudentId, Montant total, Montant payé, Montant restant, Statut (à jour, en retard, soldé). (Peut inclure une table fille pour les mensualités/installments).
8. **Payment** (Paiement unitaire) : ID, StudentId, Montant, Date, Méthode de paiement (Espèces, Virement, etc.), Enregistré par (UserId), Motif, Référence.
9. **Expense** (Dépense) : ID, Titre, Catégorie, Montant, Date, Description, Enregistré par (UserId).

## 6. Décisions de Design (Aesthetics) & Instructions pour l'IA
1. **Design & Thème :**
   - **Arrière-plan Global :** Utiliser systématiquement la couleur `#F4F4F4` (`bg-background` dans Tailwind) pour le fond de toutes les vues.
   - **Couleur Primaire :** Les boutons d'action principale et les avatars doivent utiliser la couleur primaire (`bg-primary`). **Interdiction formelle** d'utiliser d'autres couleurs par défaut pour les actions principales.
   - **Barres de recherche et Filtres :** Modèle uniformisé : Largeur fixe de `w-96` pour la recherche, filtres alignés sur la même ligne (flex row, `justify-between`). Toujours inclure une animation subtile au survol (ex: `hover:shadow-md hover:border-primary/50`).
   - **Modales & Formulaires :** Affichage centré avec arrière-plan flouté, animation globale `animate-fade-in` pour le fond, et `animate-fade-in-up` pour la fenêtre. Réutiliser le composant `<Modal>`.
2. **Gestion de l'UI & UX :**
   - **Notifications :** Ne jamais utiliser `alert()` du navigateur. Toujours appeler `useUIStore.getState().showToast()` pour les messages de succès ou d'erreur.
   - **Mises à jour dynamiques :** L'UI (comme la Sidebar ou la Topbar) doit réagir aux modifications (ex. changement d'avatar) via des événements globaux `window.dispatchEvent(new CustomEvent('event_name'))`.
   - **Listes déroulantes :** Remplacer `<select>` par le composant custom `<Select>` (`@/components/ui/select`).
   - **Info-bulles :** Pas de `title` natif, utiliser Tailwind via `group` et `group-hover:opacity-100`.
   - **Chiffres :** Toujours formater avec `Intl.NumberFormat('fr-FR').format(value)` (FCFA).
3. **Traitements des données (Front-end actuel) :**
   - **Images :** Pour l'upload, **utiliser obligatoirement `FileReader`** (`readAsDataURL`) pour convertir les images en Base64. Ne jamais utiliser `URL.createObjectURL` (ne survit pas à un rechargement localStorage).
   - **Sécurité :** Ne pas exposer ou implémenter d'options pour effacer entièrement la base de données depuis l'interface client.
   - **Logique Métier :** Gérer dynamiquement les statuts (ex: statut complet d'une classe calculé via la fonction pure `getComputedClassStatus`).
4. **Code & Qualité :**
   - Produire un TypeScript rigoureux, sans variables inutilisées.
   - Utiliser `<Link>` de `next/link` pour toute navigation inter-page afin de préserver le state.

## 7. Back-Office Super Administrateur (Gouvernance Plateforme)
L'application intègre un espace Back-Office dédié à la gouvernance globale de Warriors Management :
- **Point d'accès :** `/admin/login` (séparé hermétiquement du `/login` client).
- **Cookie dédié :** `admin_auth_token` (distinct du cookie client `auth_token`).
- **Cloisonnement Middleware :** `src/middleware.ts` empêche tout utilisateur client d'accéder à `/admin/*` ou `/api/admin/*`.
- **Agrégation globale :** Utilisation de `adminPrisma` (`src/lib/db/admin.ts`) via `withAdminRoute` pour agréger les données multi-tenant (toutes organisations, utilisateurs globaux, abonnements, journal d'audit).
- **Tables ajoutées :** `Subscription` (gestion des quotas et échéances de licence) et `AuditLog` (traçabilité inaltérable des actions sensibles).
- **Suspension Organisation :** Tout compte d'une organisation dont le statut est `suspendu` est automatiquement bloqué à la connexion.

## 8. Onboarding du premier administrateur & import Excel
- **État :** porté par l'organisation (`Organization.onboardingStatus` = `non_commence` | `en_cours` | `termine`, `onboardingStep`, `onboardingSkippedSteps`, `onboardingCompletedAt/ById`) et non par l'utilisateur. `User.lastLoginAt` est renseigné à chaque connexion. Migration : `apps/web/prisma/migrations-sql/2026-09-onboarding.sql` (à exécuter une fois par environnement, avant le déploiement du code).
- **Déclenchement :** `POST /api/auth/login` renvoie `onboardingRequired` (organisation non terminée + permission `organization:write`) ; la page de connexion redirige alors vers `/onboarding` (plein écran). Bannière de reprise dans le layout tant que ce n'est pas terminé. Relance possible depuis Paramètres > Configuration & import et depuis le back-office (`POST /api/admin/organizations/[id]/onboarding`).
- **Étapes :** définies dans `src/lib/onboarding/steps.ts`. Chaque étape réutilise les APIs existantes (`/api/centers`, `/api/formations`, `/api/classes`, `/api/users`, `/api/students`) : quotas et validations serveur s'appliquent sans duplication.
- **Import Excel (`src/lib/import/`) :** une définition par type (`definitions/*.ts`, enregistrée dans `registry.ts`). Flux : `GET /api/import/[type]/template` (modèle propre à l'organisation) → `POST .../analyze` (aucune écriture) → `POST .../commit` (re-validation complète sous verrou consultatif par organisation, insertion atomique par lots `createMany`) ; `POST .../report` produit le rapport d'erreurs ré-importable. Les références (formation, centre, classe) sont résolues **par nom, dans l'organisation connectée uniquement** ; aucun identifiant n'est accepté du fichier.
- **Règle des rôles :** toute résolution nom de rôle → permissions doit être filtrée sur les rôles système + ceux de l'organisation (`orgRoleScope`, `src/lib/auth/permissions.ts`) : `Role`/`RolePermission` ne sont pas couverts par la RLS.
- **Références par id :** avant tout `connect`/création référençant un id reçu du client, vérifier son appartenance à l'organisation (`findOrgScopedOrThrow`, `assertOrgCenters`, `assertOrgRoles`) — les clés étrangères ignorent la RLS.

## 9. Mots de passe
- **Champs mot de passe :** TOUJOURS utiliser `<PasswordInput>` (`src/components/ui/password-input.tsx`) : bouton œil pour afficher/masquer la saisie. Ne jamais écrire d'`<input type="password">` nu.
- **Mot de passe provisoire :** `User.mustChangePassword` passe à `true` quand un tiers fixe le mot de passe (création d'un utilisateur, administrateur initial créé par le Super Admin, réinitialisation). Le drapeau est porté dans le JWT ; `src/middleware.ts` n'autorise alors que `/change-password` et les APIs listées dans `src/lib/auth/password-change.ts` (les autres APIs répondent 403 `PASSWORD_CHANGE_REQUIRED`). `POST /api/users/me/password` lève le drapeau et réémet le cookie. Migration : `apps/web/prisma/migrations-sql/2026-09-must-change-password.sql`.

## 10. Périmètre par centre (cloisonnement intra-organisation)
- **Règle :** un utilisateur non-ADMIN affecté à un ou plusieurs centres ne voit QUE les données de ces centres (centres, classes, étudiants, paiements, échéanciers, dépenses, formations enseignées dans ses centres ou sans classe, utilisateurs partageant un de ses centres), y compris dans les filtres, le tableau de bord, les rapports et l'import. ADMIN = toute l'organisation. Non-ADMIN sans centre = toute l'organisation.
- **Implémentation :** `withApiRoute` fournit `ctx.scope` (`src/lib/auth/centerScope.ts`), calculé à chaque requête depuis la base (rôles + centres, pas le JWT). Toute nouvelle route touchant une donnée rattachée à un centre DOIT l'appliquer : `where: { id, organizationId: orgId, ...scope.student() }`, filtres via `scope.effective(parseCenterIds(...))`, écritures via `scope.assertCenter(centerId)`. N'étaler qu'UN helper de scope par clause `where` (ils sont enveloppés dans `AND`).
- **Centres d'une formation :** relation `Formation.centers` (table `_FormationCenters`, migration `apps/web/prisma/migrations-sql/2026-09-formation-centers.sql`). Au moins un centre obligatoire à la création ; un non-ADMIN rattaché à un seul centre se le voit imposer. Une classe ne s'ouvre que dans un centre où sa formation est proposée (`FORMATION_NOT_IN_CENTER`) ; un centre ne peut être retiré d'une formation tant que des classes y sont ouvertes. Composant UI : `src/components/formations/FormationCentersField.tsx`.
- **Formations partagées** (proposées dans au moins deux centres) : modification, suppression et renommage de niveaux réservés au rôle ADMIN (`assertFormationEditable`, `src/lib/business/formations.ts`) ; `GET /api/formations` expose `sharedAcrossCenters` sans révéler les centres.
- **Centres :** création / modification / suppression réservées au rôle ADMIN (`allowedRoles`), aligné en base par `apps/web/prisma/migrations-sql/2026-09-centers-admin-only.sql`.

## 11. Rôles et permissions fines
- **Deux axes indépendants :** le rôle dit QUOI (modules, actions, données sensibles), le centre dit OÙ (section 10). Un utilisateur à plusieurs rôles cumule leurs droits.
- **Catalogue :** `src/lib/auth/permissionCatalog.ts` (partagé serveur / interface). Modules en lecture/écriture (`students`, `payments`, ...) + données sensibles transversales : `students.finance_status` (statut de paiement seul), `students.finance_detail` (montants, échéancier, paiements), `students.collect` (encaisser depuis la fiche), `dashboard.finance` (indicateurs financiers), `reports`. `normalizeGrants` applique les dépendances (écriture => lecture, détail => statut, sous-permission sans parent retirée) et retire les droits réservés à ADMIN (écriture des centres, organisation).
- **Résolution :** `withApiRoute` relit les rôles EN BASE à chaque requête (jamais ceux du JWT) et fournit `ctx.perms` (`PermissionSet`, `src/lib/auth/permissions.ts`). ADMIN a tous les droits par construction (aucune ligne en base). Données sensibles : filtrer côté serveur (`perms.studentFinance`, `perms.can('dashboard.finance','read')`, `src/lib/business/studentFinance.ts`), jamais seulement dans l'interface. Côté client : `useCan(resource, action)` et `useStudentFinanceLevel()` lisent les permissions renvoyées par `/api/auth/me` ; le menu et `PageAccessGuard` en découlent.
- **Rôles système par organisation :** GESTIONNAIRE et COMPTABLE sont copiés dans chaque organisation (`Role.systemKey`, `ensureOrgSystemRoles` à la création de l'organisation). L'organisation modifie ses copies (nom figé, non supprimables) et peut « Rétablir les réglages d'origine » (`POST /api/roles/[id]/reset`, modèles `SYSTEM_ROLE_TEMPLATES`). GESTIONNAIRE par défaut : pas de Paiements / Dépenses / Rapports ni d'indicateurs financiers, statut de paiement seulement. Migration : `apps/web/prisma/migrations-sql/2026-09-role-permissions.sql`.
- **Gestion des rôles :** ADMIN uniquement (écran Paramètres > Rôles & Permissions, `src/components/settings/RoleSettings.tsx`, modèle d'éditeur `src/lib/auth/roleEditorModel.ts`). Renommer un rôle personnalisé reporte le nouveau nom sur les comptes.
- **Anti-escalade :** un non-ADMIN autorisé à gérer les comptes ne peut attribuer que des rôles inclus dans ses propres droits, ni modifier / supprimer un compte plus puissant (`assertCanAssignRoles`).

## 12. Site public, essai gratuit et fin d'essai
- **Landing :** un visiteur non connecté qui ouvre « / » voit la landing (réécriture vers `/accueil` dans `src/middleware.ts`, l'URL reste « / ») ; un utilisateur connecté voit son tableau de bord. Pages publiques : `/accueil`, `/essai`, `/informations-legales`, marquées par l'en-tête `x-wm-public-site` pour que `app/layout.tsx` les affiche sans l'interface de l'application. Composants : `src/components/landing/`. Les forfaits sont lus dans la table `Plan` (noms et prix modifiables depuis le back-office, rien n'est codé en dur).
- **Liens entre site public et application :** toujours en `<a href>` (navigation complète), jamais `<Link>` ni `router.push`. Le layout racine choisit sa mise en page au rendu serveur ; une navigation côté client le garde tel quel, et la landing se retrouverait dans le cadre de l'application (qui renvoie vers /login faute de session).
- **Textes :** ne promouvoir que des fonctionnalités disponibles (pas de mode hors ligne), pas de tiret cadratin, chiffres d'exemple signalés comme fictifs.
- **Inscription en libre-service :** `POST /api/public/signup` (`src/lib/business/signup.ts`) crée l'organisation, un essai de 14 jours sur le forfait gratuit (limites du forfait), les rôles système et l'administrateur (mot de passe choisi, matricule affiché à la fin), puis connecte l'utilisateur et l'envoie vers l'assistant. Anti-abus : champ piège, email unique, 3 inscriptions par IP et par heure (journal d'audit `ORGANIZATION_SIGNUP`).
- **Fin d'essai / d'abonnement :** `getAccessBlock` (`src/lib/business/subscriptionAccess.ts`) coupe l'accès à la connexion et à chaque requête API dès la date de fin, sans attendre la suspension différée ; le message donne le contact. Les données sont conservées.
- **Design du site public :** système unique dans `src/components/landing/landing.css` (préfixe `.lp`) : fond clair + panneaux sombres arrondis, UN accent vert (#00CB50 ; #0A7A38 pour le petit texte sur fond clair), boutons en pilule, police Outfit. Animations sans librairie dans `LandingMotion.tsx` (un seul IntersectionObserver, découpage en mots, compteurs, parallaxe des pictogrammes) ; tout reste lisible sans JavaScript et avec prefers-reduced-motion. Maquettes reconstruites depuis l'interface réelle (pas de fausses captures, pas de faux témoignages).
- **Coordonnées commerciales et durée d'essai :** `src/lib/config/contact.ts` (provisoires).
