# Warriors Management - AI Assistant Guide

Ce fichier sert de documentation centrale et de directives pour les modèles d'IA (Gemini/Antigravity) intervenant sur le projet **Warriors Management**. Il doit être lu en début de contexte pour comprendre l'architecture, l'état d'avancement et les règles strictes de conception dictées par l'utilisateur.

## 1. Ce que fait l'application
**Warriors Management** est une application web de type ERP/Dashboard destinée à la gestion complète de centres de formation. Elle permet aux administrateurs de piloter l'ensemble de leur activité : gestion des étudiants, des inscriptions (classes et formations), de la facturation et trésorerie (paiements des frais de scolarité, gestion des dépenses) et du paramétrage de l'organisation. L'objectif est d'offrir une interface ultra-rapide, moderne et épurée.

## 2. Fonctionnalités implémentées (État actuel)
- **Tableau de bord (Overview) :** KPIs globaux, indicateurs de trésorerie (Reste à encaisser), statistiques sur les étudiants (Actifs, Nouveaux, Diplômés, Abandons), listes des paiements récents/en retard, et graphiques d'évolution.
- **Étudiants :** Listing paginé avec barre de recherche animée, filtres. Informations détaillées (statut, matricule). Navigation rapide entre étudiants via boutons `Précédent`/`Suivant`.
- **Génération de Reçu :** Impression/Génération de reçu PDF depuis le profil d'un étudiant avec intégration dynamique des données de l'Organisation (Logo, Email, Adresse, Téléphone).
- **Formations & Classes :** Gestion des programmes et des cohortes. Le statut des classes (`Ouverte` ou `Complète`) est calculé dynamiquement.
- **Paiements :** Historique des encaissements, suivi des échéanciers.
- **Dépenses :** Module CRUD complet (Ajout, Édition, Suppression) avec persistances locales et fenêtres modales de confirmation.
- **Centres & Utilisateurs :** Vues en liste avec barre de recherche animée.
- **Rapports :** Vues analytiques (Général, Formations) avec graphiques interactifs (Recharts) et sélecteurs de dates.
- **Paramètres :** Configuration de l'organisation (Nom, Adresse, Téléphone, Email), sécurité et apparence. Gestion de l'upload de logos et avatars.

## 3. Structure des fichiers
Le projet suit l'architecture standard **Next.js (App Router)** :
- `apps/web/src/app/` : Contient les différentes routes et pages de l'application (`/`, `/students`, `/classes`, `/payments`, `/expenses`, `/reports`, `/settings`, `/centers`, `/users`, `/formations`).
- `apps/web/src/components/` : Composants réutilisables.
  - `layout/` : Composants structurels (`sidebar.tsx`, `topbar.tsx`).
  - `ui/` : Composants visuels de base (`card.tsx`, `modal.tsx`, `date-picker.tsx`, `select.tsx`, `badge.tsx`, `receipt-modal.tsx`).
- `apps/web/src/lib/` : Utilitaires et gestion d'état.
  - `store/` : Stores Zustand (`useUIStore.ts`).
  - `data/mockData.ts` : **Fichier CRUCIAL**. C'est la source de vérité actuelle contenant toutes les interfaces TypeScript (`Organization`, `ClassGroup`, `Student`, etc.) et les données mockées initiales.

## 4. Technologies utilisées
- **Framework :** Next.js (App Router, React).
- **Styling :** Tailwind CSS.
- **Icônes :** Lucide React.
- **Graphiques :** Recharts.
- **Gestion d'état :** Zustand.
- **Persistance des données :** `localStorage` (clé principale `warriors_mock_organization` etc. pour simuler une base de données en mode client).
- **Génération PDF :** `react-to-print` (ou impression native du navigateur).

## 5. Décisions de Design (Aesthetics) & Règles d'UI
- **Arrière-plan Global :** Utiliser systématiquement la couleur `#F4F4F4` (qui correspond à `bg-background` reconfiguré dans le CSS) pour le fond de toutes les vues.
- **Couleur Primaire :** Les boutons d'action principale et les avatars (quand il n'y a pas d'image) doivent utiliser la couleur primaire (`bg-primary`). **Interdiction formelle** d'utiliser le violet ou l'indigo par défaut si ce n'est pas la couleur du thème.
- **Modales de Suppression :** Le design du **pop-up de suppression de Formation** est le modèle absolu. Il doit être utilisé pour uniformiser **tous** les pop-ups de suppression du projet (Centres, Utilisateurs, Étudiants, etc.).
- **Barres de recherche et Boutons :** Toujours prévoir une animation de survol subtile (ex: `hover:shadow-md hover:border-primary/50 transition-all duration-300`).
- **Info-bulles (Tooltips) :** Ne pas utiliser l'attribut natif `title`. Préférer une info-bulle stylisée avec Tailwind (via `group` et `group-hover:opacity-100` avec fond sombre `bg-gray-900` et texte blanc).
- **Listes déroulantes :** Remplacer les balises natives `<select>` par le composant custom `<Select>` du projet (situé dans `@/components/ui/select`) pour garder la cohérence du design.
- **Formatage des Nombres :** Utiliser systématiquement `Intl.NumberFormat('fr-FR').format(value)` pour tous les montants (les sommes sont en FCFA).

## 6. Instructions Strictes pour les Futurs Modèles d'IA
1. **Manipulation des Images :** Pour l'upload d'image (ex: logo organisation, avatar), **utiliser impérativement `FileReader`** (`readAsDataURL`) pour convertir l'image en Base64. Ne jamais utiliser `URL.createObjectURL` car il ne survit pas au rechargement lors d'une sauvegarde `localStorage`.
2. **Gestion des Données (Mock) :** En l'absence de vrai backend, toute nouvelle entité doit être ajoutée dans `src/lib/data/mockData.ts`. Les mises à jour doivent être lues et sauvegardées dynamiquement dans le `localStorage` pour garantir la persistance entre les pages.
3. **Logique de Domaine :** Privilégier les fonctions pures pour calculer des statuts dynamiques (Ex: `getComputedClassStatus` dans `mockData.ts`).
4. **Composants UI :** Ne pas réinventer la roue. Réutiliser systématiquement les composants existants (`Card`, `Modal`, `Select`, `DatePicker`, `Badge`). 
5. **Routage et Navigation :** Utiliser le composant `<Link>` de `next/link` pour toute navigation inter-page, afin de préserver l'état de l'application et d'éviter les rechargements inutiles ou les comportements inattendus avec `router.back()`.
6. **EsLint & Typescript :** Next.js a été configuré pour ignorer les erreurs de type et ESLint pendant le build (`ignoreDuringBuilds`). Toutefois, l'IA doit s'efforcer de produire un code TS propre et sans variables inutilisées.
