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
