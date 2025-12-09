'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

function ResetPasswordCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Vérifier que le token est valide au chargement
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/reset-password/validate?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Lien invalide ou expiré');
          setValidating(false);
          return;
        }

        setUserEmail(data.email);
        setValidating(false);
      } catch (err) {
        setError('Erreur lors de la validation du lien');
        setValidating(false);
      }
    };

    if (token) {
      validateToken();
    } else {
      setError('Token manquant');
      setValidating(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reset-password/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réinitialisation du mot de passe');
      }

      // Rediriger vers la page de connexion
      router.push(
        '/signin?message=Mot de passe réinitialisé avec succès, vous pouvez maintenant vous connecter',
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <p className="text-gray-600">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (error && !userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Lien invalide</h1>
            <p className="mt-4 text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/signin')}
              className="mt-6 cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-gray-600">
            Définissez un nouveau mot de passe pour votre compte
          </p>
          <p className="mt-1 text-sm break-all text-gray-500">{userEmail}</p>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Minimum 6 caractères</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirmer le mot de passe
            </label>
            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400 hover:text-gray-600"
                aria-label={
                  showConfirmPassword
                    ? 'Masquer la confirmation du mot de passe'
                    : 'Afficher la confirmation du mot de passe'
                }
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordCompleteContent />
    </Suspense>
  );
}
