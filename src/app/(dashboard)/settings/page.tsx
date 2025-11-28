"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useUserRole } from "@/hooks/use-user-role";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { isAdmin } = useUserRole();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // État pour les informations de l'entreprise
  const [companyData, setCompanyData] = useState({
    name: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    siret: "",
    vatNumber: "",
    logo: "",
  });
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyError, setCompanyError] = useState("");
  const [companySuccess, setCompanySuccess] = useState("");

  // Charger les informations de l'entreprise au montage (si admin)
  useEffect(() => {
    if (isAdmin) {
      const fetchCompanyData = async () => {
        try {
          setCompanyLoading(true);
          const response = await fetch("/api/settings/company");
          if (response.ok) {
            const data = await response.json();
            setCompanyData({
              name: data.name || "",
              address: data.address || "",
              city: data.city || "",
              postalCode: data.postalCode || "",
              country: data.country || "",
              phone: data.phone || "",
              email: data.email || "",
              website: data.website || "",
              siret: data.siret || "",
              vatNumber: data.vatNumber || "",
              logo: data.logo || "",
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

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError("");
    setCompanySuccess("");
    setCompanySaving(true);

    try {
      const response = await fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      setCompanySuccess("✅ Informations de l'entreprise mises à jour avec succès !");
      setTimeout(() => {
        setCompanySuccess("");
      }, 5000);
    } catch (err: any) {
      setCompanyError(err.message);
    } finally {
      setCompanySaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la modification du mot de passe");
      }

      setPasswordSuccess("✅ Mot de passe modifié avec succès !");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
      
      // Effacer le message après 5 secondes
      setTimeout(() => {
        setPasswordSuccess("");
      }, 5000);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const sections = [
    {
      title: "Profil",
      description: "Gérez vos informations personnelles",
      fields: [
        { label: "Nom", value: session?.user?.name || "Non défini" },
        { label: "Email", value: session?.user?.email || "Non défini" },
      ],
    },
  ];

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-1 text-sm text-gray-600">Gérez vos préférences et paramètres de compte</p>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="mx-auto max-w-3xl space-y-6">
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
          {sections.map((section) => (
            <div key={section.title} className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{section.description}</p>

              <div className="mt-6 space-y-4">
                {section.fields.map((field) => (
                  <div
                    key={field.label}
                    className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{field.label}</p>
                      <p className="mt-1 text-sm text-gray-600">{field.value}</p>
                    </div>
                    <button className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                      Modifier
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Section Informations de l'entreprise - Admin uniquement */}
          {isAdmin && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900">Informations de l'entreprise</h2>
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

          {/* Section Sécurité - Mot de passe */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Sécurité</h2>
            <p className="mt-1 text-sm text-gray-600">
              Gérez votre mot de passe et vos paramètres de sécurité
            </p>

            <div className="mt-6">
              {!showPasswordForm ? (
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <p className="font-medium text-gray-900">Mot de passe</p>
                    <p className="mt-1 text-sm text-gray-600">••••••••</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-900">Zone de danger</h2>
            <p className="mt-1 text-sm text-red-700">Actions irréversibles sur votre compte</p>
            <button className="mt-4 cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700">
              Supprimer mon compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

