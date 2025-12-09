# 📊 CRM Template

Un système CRM moderne et complet construit avec **Next.js 15**, **Better
Auth**, **Prisma** et **PostgreSQL**.

## ✨ Fonctionnalités

- 🔐 **Authentification sécurisée** avec Better Auth
  - Inscription/Connexion par email et mot de passe
  - Sessions sécurisées
  - Protection des routes via proxy Next.js
- 👥 **Système de rôles** (USER, ADMIN)
  - Gestion des utilisateurs (admin)
  - Création/suppression de comptes
  - Modification des rôles
  - Protection des routes par rôle
- 📊 **Tableau de bord analytique**
- 👥 **Gestion des contacts** (structure prête)
- ⚙️ **Page de paramètres utilisateur**
- 🎨 **UI moderne** avec Tailwind CSS v4
- 📱 **Design responsive**

## 🛠️ Stack technique

- **Framework**: Next.js 15 (App Router)
- **React**: React 19
- **Base de données**: PostgreSQL avec Prisma ORM
- **Authentification**: Better Auth
- **Styling**: Tailwind CSS v4
- **Langage**: TypeScript
- **Gestionnaire de paquets**: pnpm

## 🚀 Installation

1. **Cloner le projet**

```bash
git clone <votre-repo>
cd crm-template
```

2. **Installer les dépendances**

```bash
pnpm install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine du projet :

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/crm_db"

# Better Auth (générer avec: openssl rand -base64 32)
BETTER_AUTH_SECRET="votre-clé-secrète-minimum-32-caractères"
BETTER_AUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

4. **Créer la base de données**

```bash
createdb crm_db
# Ou: psql -U postgres -c "CREATE DATABASE crm_db;"
```

5. **Appliquer les migrations**

```bash
pnpm prisma migrate deploy
```

6. **Lancer le serveur de développement**

```bash
pnpm dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) pour voir l'application.

7. **Créer votre premier admin**

```bash
# Ouvrir Prisma Studio
pnpm prisma studio

# Modifier le champ "role" de votre utilisateur en "ADMIN"
```

## 📁 Structure du projet

```
src/
├── app/
│   ├── (auth)/              # Groupe de routes d'authentification
│   │   ├── signin/          # Page de connexion
│   │   └── layout.tsx       # Layout d'authentification
│   ├── (dashboard)/         # Groupe de routes protégées
│   │   ├── dashboard/       # Tableau de bord
│   │   ├── contacts/        # Gestion des contacts
│   │   ├── settings/        # Paramètres utilisateur
│   │   ├── users/           # Gestion des utilisateurs (admin)
│   │   └── layout.tsx       # Layout avec sidebar
│   ├── api/
│   │   ├── auth/[...all]/   # API routes Better Auth
│   │   └── users/           # API gestion utilisateurs
│   └── page.tsx             # Page d'accueil (redirection)
├── components/
│   └── sidebar.tsx          # Navigation sidebar
├── lib/
│   ├── auth.ts              # Configuration Better Auth (serveur)
│   ├── auth-client.ts       # Client Better Auth
│   ├── prisma.ts            # Client Prisma
│   └── roles.ts             # Helpers de gestion des rôles
└── proxy.ts            # Protection des routes (proxy)
```

## 🔒 Système de protection des routes

Ce projet utilise un **proxy Next.js** (`src/proxy.ts`) pour protéger les routes
côté serveur :

- Les pages dans `(dashboard)/` sont automatiquement protégées
- Redirection automatique vers `/signin` si non authentifié
- Redirection vers `/dashboard` si déjà connecté sur les pages d'auth
- Routes admin (`/users`) réservées aux utilisateurs avec le rôle ADMIN

## 👥 Système de rôles

Deux rôles sont disponibles :

- **USER** : Accès standard (dashboard, contacts, settings)
- **ADMIN** : Accès complet + gestion des utilisateurs

## 🎨 Personnalisation

### Ajouter une nouvelle page protégée

1. Créez votre page dans `src/app/(dashboard)/ma-page/page.tsx`
2. Ajoutez-la dans la navigation (`src/components/sidebar.tsx`)
3. (Optionnel) Protégez-la par rôle dans `src/proxy.ts`

### Modifier le thème

Les couleurs principales sont configurées avec Tailwind. Modifiez les classes
dans les composants pour personnaliser le thème.

## 📝 Scripts disponibles

```bash
pnpm dev          # Lancer le serveur de développement
pnpm build        # Build de production
pnpm start        # Lancer le serveur de production
pnpm lint         # Linter le code
pnpm format       # Formater le code avec Prettier
```

## 📄 Licence

MIT
