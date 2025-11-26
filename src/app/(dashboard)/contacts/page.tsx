"use client";

export default function ContactsPage() {
  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gérez tous vos contacts en un seul endroit
            </p>
          </div>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700">
            + Nouveau contact
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <div className="text-6xl">👥</div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Aucun contact pour le moment
          </h2>
          <p className="mt-2 text-gray-600">
            Commencez par ajouter votre premier contact
          </p>
          <button className="mt-6 rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white transition-colors hover:bg-indigo-700">
            Ajouter un contact
          </button>
        </div>
      </div>
    </div>
  );
}

