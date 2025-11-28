"use client";

import { PageHeader } from "@/components/page-header";

export default function ContactsPage() {
  return (
    <div className="h-full">
      {/* Header */}
      <PageHeader
        title="Contacts"
        description="Gérez tous vos contacts en un seul endroit"
        action={
          <button className="cursor-pointer w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto">
            + Nouveau contact
          </button>
        }
      />

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-white p-8 text-center shadow sm:p-12">
          <div className="text-4xl sm:text-6xl">👥</div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 sm:text-xl">
            Aucun contact pour le moment
          </h2>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Commencez par ajouter votre premier contact
          </p>
          <button className="cursor-pointer mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:px-6 sm:text-base">
            Ajouter un contact
          </button>
        </div>
      </div>
    </div>
  );
}

