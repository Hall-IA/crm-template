"use client";

import { useSession } from "@/lib/auth-client";

export default function SettingsPage() {
  const { data: session } = useSession();

  const sections = [
    {
      title: "Profil",
      description: "Gérez vos informations personnelles",
      fields: [
        { label: "Nom", value: session?.user?.name || "Non défini" },
        { label: "Email", value: session?.user?.email || "Non défini" },
      ],
    },
    {
      title: "Sécurité",
      description: "Paramètres de sécurité et authentification",
      fields: [
        { label: "Mot de passe", value: "••••••••" },
        { label: "Authentification 2FA", value: "Désactivée" },
      ],
    },
  ];

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gérez vos préférences et paramètres de compte
        </p>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-semibold text-gray-900">
                {section.title}
              </h2>
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
                    <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                      Modifier
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Danger Zone */}
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-900">Zone de danger</h2>
            <p className="mt-1 text-sm text-red-700">
              Actions irréversibles sur votre compte
            </p>
            <button className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700">
              Supprimer mon compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

