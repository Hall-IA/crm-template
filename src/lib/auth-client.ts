import { createAuthClient } from 'better-auth/react';

// Utiliser NEXT_PUBLIC_APP_URL si défini, sinon utiliser l'origine du navigateur
// Cela permet de fonctionner automatiquement en production sans configuration supplémentaire
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
