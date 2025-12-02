"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { PageHeader } from "@/components/page-header";
import { Search, Plus, Edit, Trash2, Eye, Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";

interface Status {
  id: string;
  name: string;
  color: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Contact {
  id: string;
  civility: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string;
  secondaryPhone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  origin: string | null;
  statusId: string | null;
  status: Status | null;
  assignedUserId: string | null;
  assignedUser: User | null;
  createdById: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtres
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [assignedUserFilter, setAssignedUserFilter] = useState<string>("");

  // Formulaire
  const [formData, setFormData] = useState({
    civility: "",
    firstName: "",
    lastName: "",
    phone: "",
    secondaryPhone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    origin: "",
    statusId: "",
    assignedUserId: "",
  });

  // Charger les statuts et utilisateurs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusesRes, usersRes] = await Promise.all([
          fetch("/api/statuses"),
          fetch("/api/users/list"),
        ]);

        if (statusesRes.ok) {
          const statusesData = await statusesRes.json();
          setStatuses(statusesData);
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };
    fetchData();
  }, []);

  // Charger les contacts
  useEffect(() => {
    fetchContacts();
  }, [search, statusFilter, assignedUserFilter]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("statusId", statusFilter);
      if (assignedUserFilter) params.append("assignedUserId", assignedUserFilter);

      const response = await fetch(`/api/contacts?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      } else {
        setError("Erreur lors du chargement des contacts");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Erreur lors du chargement des contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.phone) {
      setError("Le téléphone est obligatoire");
      return;
    }

    try {
      const url = editingContact
        ? `/api/contacts/${editingContact.id}`
        : "/api/contacts";
      const method = editingContact ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          civility: formData.civility || null,
          assignedUserId: formData.assignedUserId || session?.user?.id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      setSuccess(editingContact ? "Contact modifié avec succès !" : "Contact créé avec succès !");
      setShowModal(false);
      setEditingContact(null);
      setFormData({
        civility: "",
        firstName: "",
        lastName: "",
        phone: "",
        secondaryPhone: "",
        email: "",
        address: "",
        city: "",
        postalCode: "",
        origin: "",
        statusId: "",
        assignedUserId: "",
      });
      fetchContacts();

      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce contact ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      setSuccess("Contact supprimé avec succès !");
      fetchContacts();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      civility: contact.civility || "",
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      phone: contact.phone,
      secondaryPhone: contact.secondaryPhone || "",
      email: contact.email || "",
      address: contact.address || "",
      city: contact.city || "",
      postalCode: contact.postalCode || "",
      origin: contact.origin || "",
      statusId: contact.statusId || "",
      assignedUserId: contact.assignedUserId || "",
    });
    setShowModal(true);
  };

  const handleNewContact = () => {
    setEditingContact(null);
    setFormData({
      civility: "",
      firstName: "",
      lastName: "",
      phone: "",
      secondaryPhone: "",
      email: "",
      address: "",
      city: "",
      postalCode: "",
      origin: "",
      statusId: "",
      assignedUserId: session?.user?.id || "",
    });
    setShowModal(true);
    setError("");
    setSuccess("");
  };

  return (
    <div className="h-full">
      <PageHeader
        title="Contacts"
        description="Gérez tous vos contacts en un seul endroit"
        action={
          <button
            onClick={handleNewContact}
            className="cursor-pointer w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto"
          >
            <Plus className="mr-2 inline h-4 w-4" />
            Nouveau contact
          </button>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-600">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Filtres */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Recherche
              </label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, prénom, email, téléphone..."
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Tous les statuts</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

          <div>
              <label className="block text-sm font-medium text-gray-700">
                Assigné à
              </label>
              <select
                value={assignedUserFilter}
                onChange={(e) => setAssignedUserFilter(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Tous les utilisateurs</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Liste des contacts */}
        {loading ? (
          <div className="text-center text-gray-500">Chargement...</div>
        ) : contacts.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <div className="text-4xl sm:text-6xl">👥</div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900 sm:text-xl">
              Aucun contact trouvé
            </h2>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              {search || statusFilter || assignedUserFilter
                ? "Aucun contact ne correspond à vos critères"
                : "Commencez par ajouter votre premier contact"}
            </p>
            {!search && !statusFilter && !assignedUserFilter && (
              <button
                onClick={handleNewContact}
                className="cursor-pointer mt-6 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:text-base"
              >
                Ajouter un contact
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
                    Contact
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
                    Téléphone
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
                    Email
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
                    Statut
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
                    Assigné à
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                          {(contact.firstName?.[0] || contact.lastName?.[0] || "?").toUpperCase()}
                        </div>
                        <div className="ml-3 sm:ml-4 min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {contact.civility && `${contact.civility}. `}
                            {contact.firstName} {contact.lastName}
                          </div>
                          {contact.city && (
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="mr-1 h-3 w-3" />
                              {contact.city}
                              {contact.postalCode && ` ${contact.postalCode}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap sm:px-6">
                      <div className="flex items-center text-gray-900">
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />
                        {contact.phone}
                      </div>
                      {contact.secondaryPhone && (
                        <div className="mt-1 text-xs text-gray-500">
                          {contact.secondaryPhone}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap sm:px-6">
                      {contact.email ? (
                        <div className="flex items-center text-gray-900">
                          <Mail className="mr-2 h-4 w-4 text-gray-400" />
                          <span className="truncate max-w-[200px]">{contact.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                      {contact.status ? (
                        <span
                          className="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: `${contact.status.color}20`,
                            color: contact.status.color,
                          }}
                        >
                          {contact.status.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap sm:px-6">
                      {contact.assignedUser ? (
                        <span className="text-gray-900">{contact.assignedUser.name}</span>
                      ) : (
                        <span className="text-gray-400">Non assigné</span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-right text-sm font-medium whitespace-nowrap sm:px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="cursor-pointer rounded-lg p-2 text-indigo-600 transition-colors hover:bg-indigo-50"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleEdit(contact)}
                          className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="cursor-pointer rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
          </button>
        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 backdrop-blur-sm p-4 sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white p-6 shadow-xl sm:p-8">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  {editingContact ? "Modifier le contact" : "Nouveau contact"}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingContact(null);
                    setError("");
                  }}
                  className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Contenu scrollable */}
            <form
              id="contact-form"
              onSubmit={handleSubmit}
              className="flex-1 space-y-6 overflow-y-auto pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {/* Informations personnelles */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Informations personnelles
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Civilité
                    </label>
                    <select
                      value={formData.civility}
                      onChange={(e) =>
                        setFormData({ ...formData, civility: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">-</option>
                      <option value="M">M.</option>
                      <option value="MME">Mme</option>
                      <option value="MLLE">Mlle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Prénom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Nom"
                    />
                  </div>
                </div>
              </div>

              {/* Coordonnées */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Coordonnées</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Téléphone secondaire
                    </label>
                    <input
                      type="tel"
                      value={formData.secondaryPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, secondaryPhone: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="email@exemple.com"
                    />
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Adresse</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Adresse complète
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="123 Rue de la République"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ville</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Paris"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Code postal
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="75001"
                    />
                  </div>
                </div>
              </div>

              {/* Autres informations */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Autres informations</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Origine du contact
                    </label>
                    <input
                      type="text"
                      value={formData.origin}
                      onChange={(e) =>
                        setFormData({ ...formData, origin: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Site web, recommandation, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                      value={formData.statusId}
                      onChange={(e) =>
                        setFormData({ ...formData, statusId: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">Aucun statut</option>
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Assigné à
                    </label>
                    <select
                      value={formData.assignedUserId}
                      onChange={(e) =>
                        setFormData({ ...formData, assignedUserId: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">Non assigné</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
              )}
            </form>

            {/* Pied de modal fixe */}
            <div className="shrink-0 border-t border-gray-100 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingContact(null);
                    setError("");
                  }}
                  className="cursor-pointer w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="contact-form"
                  className="cursor-pointer w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto"
                >
                  {editingContact ? "Modifier" : "Créer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
