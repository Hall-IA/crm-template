This is a [Next.js](https://nextjs.org) project bootstrapped with
[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Configuration de la base de données

Créez un fichier `.env` à la racine du projet avec la configuration PostgreSQL et la clé de session :

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/crm_template?schema=public"

# Clé secrète pour les sessions (minimum 32 caractères)
# Générez une clé sécurisée avec: openssl rand -base64 32
SESSION_SECRET="your-super-secret-key-at-least-32-characters-long"

# Environnement
NODE_ENV="development"
```

Remplacez `USER` et `PASSWORD` par vos identifiants PostgreSQL locaux, et générez une clé secrète pour `SESSION_SECRET`.

> **Prisma 7** : Ce projet utilise la nouvelle architecture de Prisma 7 où l'URL de connexion est dans `prisma.config.ts` au lieu du schema.

### 2. Installation des dépendances

```bash
pnpm install
```

### 3. Migration de la base de données

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

### 4. Lancer le serveur de développement

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur. Vous serez automatiquement redirigé vers la page de connexion.

## Système d'authentification

Ce projet inclut un système d'authentification complet avec :

### Fonctionnalités
- ✅ Inscription avec email/password
- ✅ Connexion avec email/password
- ✅ Mots de passe hashés avec bcryptjs
- ✅ Sessions sécurisées avec iron-session
- ✅ Middleware pour protéger les routes
- ✅ Layout protégé `(app)` pour l'application
- ✅ Validation des formulaires avec Zod et React Hook Form
- ✅ Validation côté client et serveur

### Routes disponibles
- `/signin` - Page de connexion
- `/signup` - Page d'inscription
- `/app` - Dashboard protégé (nécessite authentification)

### Routes API
- `POST /api/auth/signup` - Inscription
- `POST /api/auth/signin` - Connexion
- `POST /api/auth/signout` - Déconnexion
- `GET /api/auth/user` - Récupérer l'utilisateur connecté

### Sécurité
- Les mots de passe sont hashés avant stockage en base de données
- Les sessions utilisent des cookies httpOnly
- Les routes sont automatiquement protégées par middleware
- Redirection automatique selon l'état d'authentification
- Validation des données avec Zod côté client et serveur
- Protection contre les injections et données malformées

### Documentation
- [SETUP_AUTH.md](./SETUP_AUTH.md) - Configuration de l'authentification
- [VALIDATION_ZOD.md](./VALIDATION_ZOD.md) - Guide de validation avec Zod
- [QUICKSTART.md](./QUICKSTART.md) - Guide de démarrage rapide

This project uses
[`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
to automatically optimize and load [Geist](https://vercel.com/font), a new font
family for Vercel.

## Outils de développement

### Prettier

Le projet utilise Prettier avec le plugin Tailwind CSS pour le formatage
automatique du code.

```bash
# Formater tous les fichiers
pnpm format

# Vérifier le formatage sans modifier les fichiers
pnpm format:check
```

### Fonction utilitaire `cn()`

Le projet inclut une fonction `cn()` dans `src/lib/utils.ts` qui combine `clsx`
et `tailwind-merge` pour gérer les classes CSS conditionnelles :

```typescript
import { cn } from "@/lib/utils";

<div className={cn("base-class", condition && "conditional-class")} />
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out
[the Next.js GitHub repository](https://github.com/vercel/next.js) - your
feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the
[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our
[Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)
for more details.
