'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { useUserRole } from '@/hooks/use-user-role';
import { PageHeader } from '@/components/page-header';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isAdmin } = useUserRole();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // État pour la modification du nom
  const [showNameForm, setShowNameForm] = useState(false);
  const [nameValue, setNameValue] = useState(session?.user?.name || '');
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  // État pour les informations de l'entreprise
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    siret: '',
    vatNumber: '',
    logo: '',
  });
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [companySuccess, setCompanySuccess] = useState('');

  // État pour la configuration SMTP
  const [smtpData, setSmtpData] = useState({
    host: '',
    port: '587',
    secure: false,
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
  });
  const [smtpLoading, setSmtpLoading] = useState(true);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpError, setSmtpError] = useState('');
  const [smtpSuccess, setSmtpSuccess] = useState('');
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [smtpConfigured, setSmtpConfigured] = useState(false);

  // État pour la gestion des statuts
  interface Status {
    id: string;
    name: string;
    color: string;
    order: number;
  }
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [statusesLoading, setStatusesLoading] = useState(true);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [statusFormData, setStatusFormData] = useState({
    name: '',
    color: '#3B82F6',
  });
  const [statusError, setStatusError] = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  // Mettre à jour le nom quand la session change
  useEffect(() => {
    if (session?.user?.name) {
      setNameValue(session.user.name);
    }
  }, [session?.user?.name]);

  // Charger les informations de l'entreprise au montage (si admin)
  useEffect(() => {
    if (isAdmin) {
      const fetchCompanyData = async () => {
        try {
          setCompanyLoading(true);
          const response = await fetch('/api/settings/company');
          if (response.ok) {
            const data = await response.json();
            setCompanyData({
              name: data.name || '',
              address: data.address || '',
              city: data.city || '',
              postalCode: data.postalCode || '',
              country: data.country || '',
              phone: data.phone || '',
              email: data.email || '',
              website: data.website || '',
              siret: data.siret || '',
              vatNumber: data.vatNumber || '',
              logo: data.logo || '',
            });
          }
        } catch (error) {
          console.error("Erreur lors du chargement des informations de l'entreprise:", error);
        } finally {
          setCompanyLoading(false);
        }
      };
      fetchCompanyData();
    }
  }, [isAdmin]);

  // Charger la configuration SMTP au montage
  useEffect(() => {
    const fetchSmtpData = async () => {
      try {
        setSmtpLoading(true);
        const response = await fetch('/api/settings/smtp');
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setSmtpData({
              host: data.host || '',
              port: data.port?.toString() || '587',
              secure: data.secure || false,
              username: data.username || '',
              password: '', // Ne pas charger le mot de passe
              fromEmail: data.fromEmail || '',
              fromName: data.fromName || '',
            });
            setSmtpConfigured(true);
          } else {
            setSmtpConfigured(false);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la config SMTP:', error);
        setSmtpConfigured(false);
      } finally {
        setSmtpLoading(false);
      }
    };
    fetchSmtpData();
  }, []);

  // Charger les statuts au montage (si admin)
  useEffect(() => {
    if (isAdmin) {
      const fetchStatuses = async () => {
        try {
          setStatusesLoading(true);
          const response = await fetch('/api/settings/statuses');
          if (response.ok) {
            const data = await response.json();
            setStatuses(data);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des statuts:', error);
        } finally {
          setStatusesLoading(false);
        }
      };
      fetchStatuses();
    }
  }, [isAdmin]);

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError('');
    setCompanySuccess('');
    setCompanySaving(true);

    try {
      const response = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      setCompanySuccess("✅ Informations de l'entreprise mises à jour avec succès !");
      setTimeout(() => {
        setCompanySuccess('');
      }, 5000);
    } catch (err: any) {
      setCompanyError(err.message);
    } finally {
      setCompanySaving(false);
    }
  };

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');

    if (!nameValue.trim()) {
      setNameError('Le nom ne peut pas être vide');
      return;
    }

    setNameLoading(true);

    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du nom');
      }

      setNameSuccess('✅ Nom mis à jour avec succès !');
      setShowNameForm(false);

      // Rafraîchir la page pour mettre à jour la session
      router.refresh();

      // Effacer le message après 5 secondes
      setTimeout(() => {
        setNameSuccess('');
      }, 5000);
    } catch (err: any) {
      setNameError(err.message);
    } finally {
      setNameLoading(false);
    }
  };

  const handleSmtpTest = async () => {
    setSmtpTestResult(null);
    setSmtpError('');
    setSmtpTesting(true);

    try {
      const response = await fetch('/api/settings/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpData),
      });

      const data = await response.json();

      if (data.success) {
        setSmtpTestResult({
          success: true,
          message: data.message || 'Connexion SMTP réussie !',
        });
        setSmtpConfigured(true);
      } else {
        setSmtpTestResult({
          success: false,
          message: data.message || 'Échec de la connexion SMTP',
        });
        setSmtpConfigured(false);
      }
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err.message || 'Erreur lors du test de connexion',
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  const handleSmtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpError('');
    setSmtpSuccess('');
    setSmtpSaving(true);

    try {
      const response = await fetch('/api/settings/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setSmtpSuccess('✅ Configuration SMTP sauvegardée avec succès !');
      // Si le test a réussi précédemment, garder l'indicateur de configuration
      if (smtpTestResult?.success) {
        setSmtpConfigured(true);
      }
      setTimeout(() => {
        setSmtpSuccess('');
      }, 5000);
    } catch (err: any) {
      setSmtpError(err.message);
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError('');
    setStatusSuccess('');
    setStatusSaving(true);

    try {
      const url = editingStatus
        ? `/api/settings/statuses/${editingStatus.id}`
        : '/api/settings/statuses';
      const method = editingStatus ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setStatusSuccess(
        editingStatus ? '✅ Statut modifié avec succès !' : '✅ Statut créé avec succès !',
      );
      setShowStatusForm(false);
      setEditingStatus(null);
      setStatusFormData({ name: '', color: '#3B82F6' });

      // Recharger les statuts
      const statusesResponse = await fetch('/api/settings/statuses');
      if (statusesResponse.ok) {
        const statusesData = await statusesResponse.json();
        setStatuses(statusesData);
      }

      setTimeout(() => {
        setStatusSuccess('');
      }, 5000);
    } catch (err: any) {
      setStatusError(err.message);
    } finally {
      setStatusSaving(false);
    }
  };

  const handleStatusDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce statut ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/statuses/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      setStatusSuccess('✅ Statut supprimé avec succès !');
      setTimeout(() => {
        setStatusSuccess('');
      }, 5000);

      // Recharger les statuts
      const statusesResponse = await fetch('/api/settings/statuses');
      if (statusesResponse.ok) {
        const statusesData = await statusesResponse.json();
        setStatuses(statusesData);
      }
    } catch (err: any) {
      setStatusError(err.message);
    }
  };

  const handleStatusEdit = (status: Status) => {
    setEditingStatus(status);
    setStatusFormData({
      name: status.name,
      color: status.color,
    });
    setShowStatusForm(true);
    setStatusError('');
    setStatusSuccess('');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification du mot de passe');
      }

      setPasswordSuccess('✅ Mot de passe modifié avec succès !');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordForm(false);

      // Effacer le message après 5 secondes
      setTimeout(() => {
        setPasswordSuccess('');
      }, 5000);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="h-full">
      {/* Header */}
      <PageHeader title="Paramètres" description="Gérez vos préférences et paramètres de compte" />

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
          {/* Message de succès global */}
          {passwordSuccess && !showPasswordForm && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center">
                <svg
                  className="mr-3 h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-green-800">{passwordSuccess}</p>
                <button
                  onClick={() => setPasswordSuccess('')}
                  className="ml-auto cursor-pointer text-green-600 hover:text-green-800"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
          {/* Section Profil */}
          <div className="rounded-lg bg-white p-4 shadow sm:p-6">
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Profil</h2>
            <p className="mt-1 text-sm text-gray-600">Gérez vos informations personnelles</p>

            <div className="mt-4 space-y-4 sm:mt-6">
              {/* Nom - Modifiable */}
              <div className="border-b border-gray-100 pb-4">
                {!showNameForm ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">Nom</p>
                      <p className="mt-1 truncate text-sm text-gray-600">
                        {session?.user?.name || 'Non défini'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowNameForm(true);
                        setNameValue(session?.user?.name || '');
                        setNameError('');
                        setNameSuccess('');
                      }}
                      className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                    >
                      Modifier
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleNameUpdate} className="space-y-4">
                    {nameSuccess && (
                      <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600">
                        {nameSuccess}
                      </div>
                    )}

                    {nameError && (
                      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                        {nameError}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom</label>
                      <input
                        type="text"
                        required
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Votre nom"
                      />
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="submit"
                        disabled={nameLoading}
                        className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        {nameLoading ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNameForm(false);
                          setNameValue(session?.user?.name || '');
                          setNameError('');
                          setNameSuccess('');
                        }}
                        className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Email - Lecture seule */}
              <div className="pb-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="mt-1 truncate text-sm text-gray-600">
                      {session?.user?.email || 'Non défini'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">L'email ne peut pas être modifié</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Sécurité - Mot de passe */}
          <div className="rounded-lg bg-white p-4 shadow sm:p-6">
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Sécurité</h2>
            <p className="mt-1 text-sm text-gray-600">
              Gérez votre mot de passe et vos paramètres de sécurité
            </p>

            <div className="mt-4 sm:mt-6">
              {!showPasswordForm ? (
                <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">Mot de passe</p>
                    <p className="mt-1 text-sm text-gray-600">••••••••</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                  >
                    Modifier
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {passwordSuccess && (
                    <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600">
                      {passwordSuccess}
                    </div>
                  )}

                  {passwordError && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                      {passwordError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="••••••••"
                    />
                    <p className="mt-1 text-xs text-gray-500">Minimum 6 caractères</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {passwordLoading ? 'Modification...' : 'Modifier le mot de passe'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                        setPasswordError('');
                        setPasswordSuccess('');
                      }}
                      className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Section Informations de l'entreprise - Admin uniquement */}
          {isAdmin && (
            <div className="rounded-lg bg-white p-4 shadow sm:p-6">
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                Informations de l'entreprise
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Gérez les informations de votre entreprise (visible uniquement par les
                administrateurs)
              </p>

              {companySuccess && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center">
                    <svg
                      className="mr-3 h-5 w-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-green-800">{companySuccess}</p>
                    <button
                      onClick={() => setCompanySuccess('')}
                      className="ml-auto cursor-pointer text-green-600 hover:text-green-800"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {companyError && (
                <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  {companyError}
                </div>
              )}

              {companyLoading ? (
                <div className="mt-6 text-center text-gray-500">Chargement...</div>
              ) : (
                <form onSubmit={handleCompanySubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nom de l'entreprise *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyData.name}
                        onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Nom de l'entreprise"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={companyData.email}
                        onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="contact@entreprise.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                      <input
                        type="tel"
                        value={companyData.phone}
                        onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="+33 1 23 45 67 89"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Site web</label>
                      <input
                        type="url"
                        value={companyData.website}
                        onChange={(e) =>
                          setCompanyData({ ...companyData, website: e.target.value })
                        }
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="https://www.entreprise.com"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Adresse</label>
                      <input
                        type="text"
                        value={companyData.address}
                        onChange={(e) =>
                          setCompanyData({ ...companyData, address: e.target.value })
                        }
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="123 Rue de la République"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ville</label>
                      <input
                        type="text"
                        value={companyData.city}
                        onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Paris"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Code postal</label>
                      <input
                        type="text"
                        value={companyData.postalCode}
                        onChange={(e) =>
                          setCompanyData({ ...companyData, postalCode: e.target.value })
                        }
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="75001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pays</label>
                      <input
                        type="text"
                        value={companyData.country}
                        onChange={(e) =>
                          setCompanyData({ ...companyData, country: e.target.value })
                        }
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="France"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">SIRET</label>
                      <input
                        type="text"
                        value={companyData.siret}
                        onChange={(e) => setCompanyData({ ...companyData, siret: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="123 456 789 00012"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Numéro TVA</label>
                      <input
                        type="text"
                        value={companyData.vatNumber}
                        onChange={(e) =>
                          setCompanyData({ ...companyData, vatNumber: e.target.value })
                        }
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="FR12 345678901"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">URL du logo</label>
                      <input
                        type="url"
                        value={companyData.logo}
                        onChange={(e) => setCompanyData({ ...companyData, logo: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={companySaving}
                      className="cursor-pointer rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {companySaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Section Configuration SMTP */}
          <div className="rounded-lg bg-white p-4 shadow sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                  Configuration SMTP
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Configurez votre serveur SMTP pour envoyer des emails avec votre email de société
                </p>
              </div>
              {smtpConfigured && (
                <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5">
                  <svg
                    className="h-4 w-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs font-medium text-green-800">Fonctionnel</span>
                </div>
              )}
            </div>

            {smtpSuccess && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center">
                  <svg
                    className="mr-3 h-5 w-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-green-800">{smtpSuccess}</p>
                  <button
                    onClick={() => setSmtpSuccess('')}
                    className="ml-auto cursor-pointer text-green-600 hover:text-green-800"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {smtpError && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">{smtpError}</div>
            )}

            {smtpTestResult && (
              <div
                className={`mt-4 rounded-lg p-4 ${
                  smtpTestResult.success
                    ? 'border border-green-200 bg-green-50'
                    : 'border border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center">
                  {smtpTestResult.success ? (
                    <svg
                      className="mr-3 h-5 w-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="mr-3 h-5 w-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                  <p
                    className={`text-sm font-medium ${
                      smtpTestResult.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {smtpTestResult.message}
                  </p>
                  <button
                    onClick={() => setSmtpTestResult(null)}
                    className="ml-auto cursor-pointer text-gray-600 hover:text-gray-800"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {smtpLoading ? (
              <div className="mt-6 text-center text-gray-500">Chargement...</div>
            ) : (
              <form onSubmit={handleSmtpSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Serveur SMTP (Host) *
                    </label>
                    <input
                      type="text"
                      required
                      value={smtpData.host}
                      onChange={(e) => setSmtpData({ ...smtpData, host: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Port *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="65535"
                      value={smtpData.port}
                      onChange={(e) => setSmtpData({ ...smtpData, port: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="587"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Ports courants : 587 (TLS), 465 (SSL), 25 (non sécurisé)
                    </p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="smtp-secure"
                      checked={smtpData.secure}
                      onChange={(e) => setSmtpData({ ...smtpData, secure: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="smtp-secure" className="ml-2 text-sm font-medium text-gray-700">
                      Connexion sécurisée (SSL/TLS)
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Nom d'utilisateur *
                    </label>
                    <input
                      type="text"
                      required
                      value={smtpData.username}
                      onChange={(e) => setSmtpData({ ...smtpData, username: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="votre.email@exemple.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      required
                      value={smtpData.password}
                      onChange={(e) => setSmtpData({ ...smtpData, password: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="••••••••"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Pour Gmail, utilisez un mot de passe d'application
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email expéditeur (From) *
                    </label>
                    <input
                      type="email"
                      required
                      value={smtpData.fromEmail}
                      onChange={(e) => setSmtpData({ ...smtpData, fromEmail: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="votre.email@exemple.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nom expéditeur (optionnel)
                    </label>
                    <input
                      type="text"
                      value={smtpData.fromName}
                      onChange={(e) => setSmtpData({ ...smtpData, fromName: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Votre Nom"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleSmtpTest}
                    disabled={smtpTesting || smtpSaving}
                    className="w-full cursor-pointer rounded-lg border border-indigo-600 px-6 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {smtpTesting ? 'Test en cours...' : 'Tester la connexion'}
                  </button>
                  <button
                    type="submit"
                    disabled={smtpSaving || smtpTesting}
                    className="w-full cursor-pointer rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {smtpSaving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section Gestion des statuts - Admin uniquement */}
          {isAdmin && (
            <div className="rounded-lg bg-white p-4 shadow sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                    Gestion des statuts
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Gérez les statuts pour catégoriser vos contacts
                  </p>
                </div>
                {!showStatusForm && (
                  <button
                    onClick={() => {
                      setShowStatusForm(true);
                      setEditingStatus(null);
                      setStatusFormData({ name: '', color: '#3B82F6' });
                      setStatusError('');
                      setStatusSuccess('');
                    }}
                    className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    + Ajouter un statut
                  </button>
                )}
              </div>

              {statusSuccess && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center">
                    <svg
                      className="mr-3 h-5 w-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-green-800">{statusSuccess}</p>
                    <button
                      onClick={() => setStatusSuccess('')}
                      className="ml-auto cursor-pointer text-green-600 hover:text-green-800"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {statusError && (
                <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  {statusError}
                </div>
              )}

              {showStatusForm ? (
                <form onSubmit={handleStatusSubmit} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nom du statut *
                      </label>
                      <input
                        type="text"
                        required
                        value={statusFormData.name}
                        onChange={(e) =>
                          setStatusFormData({ ...statusFormData, name: e.target.value })
                        }
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Ex: Nouveau"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Couleur *</label>
                      <div className="mt-1 flex items-center gap-3">
                        <input
                          type="color"
                          value={statusFormData.color}
                          onChange={(e) =>
                            setStatusFormData({ ...statusFormData, color: e.target.value })
                          }
                          className="h-10 w-20 cursor-pointer rounded-lg border border-gray-300"
                        />
                        <input
                          type="text"
                          value={statusFormData.color}
                          onChange={(e) =>
                            setStatusFormData({ ...statusFormData, color: e.target.value })
                          }
                          className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStatusForm(false);
                        setEditingStatus(null);
                        setStatusFormData({ name: '', color: '#3B82F6' });
                        setStatusError('');
                        setStatusSuccess('');
                      }}
                      className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={statusSaving}
                      className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {statusSaving ? 'Enregistrement...' : editingStatus ? 'Modifier' : 'Créer'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-6">
                  {statusesLoading ? (
                    <div className="text-center text-gray-500">Chargement...</div>
                  ) : statuses.length === 0 ? (
                    <div className="text-center text-gray-500">
                      Aucun statut. Cliquez sur "Ajouter un statut" pour en créer un.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {statuses.map((status) => (
                        <div
                          key={status.id}
                          className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-6 w-6 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            <span className="font-medium text-gray-900">{status.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStatusEdit(status)}
                              className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleStatusDelete(status.id)}
                              className="cursor-pointer rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
