# 📊 CRM Template

Un système CRM moderne et complet construit avec **Next.js 15**, **Better Auth**, **Prisma** et **PostgreSQL**.

## ✨ Fonctionnalités

- 🔐 **Authentification sécurisée** avec Better Auth
  - Inscription/Connexion par email et mot de passe
  - Sessions sécurisées
  - Protection des routes via un composant proxy
- 👥 **Gestion des contacts** (structure prête)
- 📊 **Tableau de bord analytique**
- 🎯 **Gestion des leads et opportunités**
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
DATABASE_URL="postgresql://user:password@localhost:5432/crm_db"

# Better Auth
BETTER_AUTH_SECRET="votre-clé-secrète-changez-en-production"
BETTER_AUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

4. **Configurer la base de données**

```bash
# Appliquer les migrations Prisma
pnpm prisma migrate dev

# Ou générer le client Prisma
pnpm prisma generate
```

5. **Lancer le serveur de développement**

```bash
pnpm dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) pour voir l'application.

## 📁 Structure du projet

```
src/
├── app/
│   ├── (auth)/              # Groupe de routes d'authentification
│   │   ├── signin/          # Page de connexion
│   │   └── signup/          # Page d'inscription
│   ├── (app)/               # Groupe de routes protégées
│   │   ├── dashboard/       # Tableau de bord
│   │   ├── contacts/        # Gestion des contacts
│   │   ├── leads/           # Gestion des leads
│   │   ├── opportunities/   # Gestion des opportunités
│   │   ├── settings/        # Paramètres utilisateur
│   │   └── layout.tsx       # Layout avec sidebar
│   ├── api/
│   │   └── auth/[...all]/   # API routes Better Auth
│   └── page.tsx             # Page d'accueil (landing page)
├── components/
│   ├── route-guard.tsx      # Composant de protection des routes (proxy)
│   └── sidebar.tsx          # Navigation sidebar
└── lib/
    ├── auth.ts              # Configuration Better Auth (serveur)
    ├── auth-client.ts       # Client Better Auth
    └── prisma.ts            # Client Prisma
```

## 🔒 Système de protection des routes

Ce projet utilise un **composant proxy** (`RouteGuard`) au lieu d'un middleware Next.js pour protéger les routes :

- Les pages dans `(app)/` sont automatiquement protégées via le layout
- Redirection automatique vers `/signin` si non authentifié
- Redirection vers `/app/dashboard` si déjà connecté sur les pages d'auth

## 🎨 Personnalisation

### Ajouter une nouvelle page protégée

1. Créez votre page dans `src/app/(app)/ma-page/page.tsx`
2. Ajoutez-la dans la navigation (`src/components/sidebar.tsx`)

### Modifier le thème

Les couleurs principales sont configurées avec Tailwind. Modifiez les classes dans les composants pour personnaliser le thème.

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://better-auth.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

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
