'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { useUserRole } from '@/hooks/use-user-role';
import { PageHeader } from '@/components/page-header';
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin, Upload, X, Filter } from 'lucide-react';
import { ContactTableSkeleton } from '@/components/skeleton';

interface Status {
  id: string;
  name: string;
  color: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
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
  companyName: string | null;
  isCompany: boolean;
  companyId: string | null;
  companyRelation: Contact | null;
  statusId: string | null;
  status: Status | null;
  assignedCommercialId: string | null;
  assignedCommercial: User | null;
  assignedTeleproId: string | null;
  assignedTelepro: User | null;
  createdById: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isAdmin } = useUserRole();

  // Fonction pour formater les dates en français
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importMapping, setImportMapping] = useState<{ [key: string]: string }>({});
  const [importSkipFirstRow, setImportSkipFirstRow] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Filtres
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [assignedCommercialFilter, setAssignedCommercialFilter] = useState<string>('');
  const [assignedTeleproFilter, setAssignedTeleproFilter] = useState<string>('');

  // Formulaire
  const [formData, setFormData] = useState({
    civility: '',
    firstName: '',
    lastName: '',
    phone: '',
    secondaryPhone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    origin: '',
    company: '',
    isCompany: false,
    companyId: '',
    statusId: '',
    assignedCommercialId: '',
    assignedTeleproId: '',
  });

  // Synchronisation automatique Google Sheets
  useEffect(() => {
    const syncGoogleSheet = async () => {
      try {
        await fetch('/api/integrations/google-sheet/sync', {
          method: 'POST',
        });
      } catch (err) {
        console.error('Erreur lors de la synchronisation Google Sheets:', err);
      }
    };

    syncGoogleSheet();
  }, []);

  // Charger les statuts et utilisateurs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusesRes, usersRes] = await Promise.all([
          fetch('/api/statuses'),
          fetch('/api/users/list'),
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
        console.error('Erreur lors du chargement des données:', error);
      }
    };
    fetchData();
  }, []);

  // Charger les contacts
  useEffect(() => {
    fetchContacts();
  }, [search, statusFilter, assignedCommercialFilter, assignedTeleproFilter]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('statusId', statusFilter);
      if (assignedCommercialFilter) params.append('assignedCommercialId', assignedCommercialFilter);
      if (assignedTeleproFilter) params.append('assignedTeleproId', assignedTeleproFilter);

      const response = await fetch(`/api/contacts?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      } else {
        setError('Erreur lors du chargement des contacts');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement des contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.phone) {
      setError('Le téléphone est obligatoire');
      return;
    }

    try {
      const url = editingContact ? `/api/contacts/${editingContact.id}` : '/api/contacts';
      const method = editingContact ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          civility: formData.civility || null,
          companyName: formData.company || null,
          isCompany: formData.isCompany || false,
          companyId: formData.companyId || null,
          assignedCommercialId: formData.assignedCommercialId || null,
          assignedTeleproId: formData.assignedTeleproId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setSuccess(editingContact ? 'Contact modifié avec succès !' : 'Contact créé avec succès !');
      setShowModal(false);
      setEditingContact(null);
      setFormData({
        civility: '',
        firstName: '',
        lastName: '',
        phone: '',
        secondaryPhone: '',
        email: '',
        address: '',
        city: '',
        postalCode: '',
        origin: '',
        company: '',
        isCompany: false,
        companyId: '',
        statusId: '',
        assignedCommercialId: '',
        assignedTeleproId: '',
      });
      fetchContacts();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    // Vérifier que l'utilisateur est administrateur
    if (!isAdmin) {
      setError('Seuls les administrateurs peuvent supprimer un contact');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      setSuccess('Contact supprimé avec succès !');
      fetchContacts();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      civility: contact.civility || '',
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      phone: contact.phone,
      secondaryPhone: contact.secondaryPhone || '',
      email: contact.email || '',
      address: contact.address || '',
      city: contact.city || '',
      postalCode: contact.postalCode || '',
      origin: contact.origin || '',
      company: contact.companyName || '',
      isCompany: contact.isCompany || false,
      companyId: contact.companyId || '',
      statusId: contact.statusId || '',
      assignedCommercialId: contact.assignedCommercialId || '',
      assignedTeleproId: contact.assignedTeleproId || '',
    });
    setShowModal(true);
  };

  const handleNewContact = () => {
    setEditingContact(null);
    setFormData({
      civility: '',
      firstName: '',
      lastName: '',
      phone: '',
      secondaryPhone: '',
      email: '',
      address: '',
      city: '',
      postalCode: '',
      origin: '',
      isCompany: false,
      companyId: '',
      company: '',
      statusId: '',
      assignedCommercialId: '',
      assignedTeleproId: '',
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  // Fonctions d'import
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportResult(null);
    setError('');

    try {
      // Parser le fichier pour obtenir les en-têtes et un aperçu
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.split('.').pop();

      if (fileExtension === 'csv') {
        const text = await file.text();
        const lines = text.split('\n').filter((line) => line.trim() !== '');
        if (lines.length === 0) {
          setError('Le fichier est vide');
          return;
        }

        const delimiter = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
        setImportHeaders(headers);

        // Prévisualiser les 5 premières lignes
        const preview: any[] = [];
        for (let i = 1; i < Math.min(6, lines.length); i++) {
          const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          preview.push(row);
        }
        setImportPreview(preview);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Pour Excel, on a besoin de xlsx
        try {
          const XLSX = require('xlsx');
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

          if (data.length === 0) {
            setError('Le fichier est vide');
            return;
          }

          const headers: any = Object.keys(data[0] as any);
          setImportHeaders(headers);
          setImportPreview(data.slice(0, 5));
        } catch (error) {
          setError(
            'Erreur lors du parsing Excel. Assurez-vous que xlsx est installé (npm install xlsx)',
          );
        }
      } else {
        setError('Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls)');
        return;
      }

      // Initialiser le mapping avec des suggestions automatiques
      const autoMapping: { [key: string]: string } = {};
      importHeaders.forEach((header: string) => {
        const lowerHeader = header.toLowerCase();
        if (
          lowerHeader.includes('téléphone') ||
          lowerHeader.includes('telephone') ||
          lowerHeader.includes('phone')
        ) {
          autoMapping.phone = header;
        } else if (
          lowerHeader.includes('prénom') ||
          lowerHeader.includes('prenom') ||
          lowerHeader.includes('firstname') ||
          lowerHeader.includes('first')
        ) {
          autoMapping.firstName = header;
        } else if (
          lowerHeader.includes('nom') ||
          lowerHeader.includes('lastname') ||
          lowerHeader.includes('last')
        ) {
          autoMapping.lastName = header;
        } else if (lowerHeader.includes('email') || lowerHeader.includes('mail')) {
          autoMapping.email = header;
        } else if (
          lowerHeader.includes('civilité') ||
          lowerHeader.includes('civilite') ||
          lowerHeader.includes('civility')
        ) {
          autoMapping.civility = header;
        } else if (lowerHeader.includes('adresse') || lowerHeader.includes('address')) {
          autoMapping.address = header;
        } else if (lowerHeader.includes('ville') || lowerHeader.includes('city')) {
          autoMapping.city = header;
        } else if (lowerHeader.includes('code postal') || lowerHeader.includes('postal')) {
          autoMapping.postalCode = header;
        } else if (lowerHeader.includes('origine') || lowerHeader.includes('origin')) {
          autoMapping.origin = header;
        }
      });
      setImportMapping(autoMapping);
    } catch (error: any) {
      setError(`Erreur lors de la lecture du fichier: ${error.message}`);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    if (!importMapping.phone) {
      setError('Le mapping du téléphone est obligatoire');
      return;
    }

    setImporting(true);
    setError('');
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('mapping', JSON.stringify(importMapping));
      formData.append('skipFirstRow', importSkipFirstRow.toString());

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'import");
      }

      setImportResult(result);
      setSuccess(`Import réussi: ${result.imported} contact(s) importé(s)`);
      fetchContacts();

      // Fermeture de la modal
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview([]);
      setImportHeaders([]);
      setImportMapping({});
      setImportResult(null);
      setSuccess('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="h-full">
      <PageHeader
        title="Contacts"
        description="Gérez tous vos contacts en un seul endroit"
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => setShowImportModal(true)}
              className="w-full cursor-pointer rounded-lg border border-indigo-600 bg-white px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 sm:w-auto"
            >
              <Upload className="mr-2 inline h-4 w-4" />
              Importer
            </button>
            <button
              onClick={handleNewContact}
              className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto"
            >
              <Plus className="mr-2 inline h-4 w-4" />
              Nouveau contact
            </button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-600">{success}</div>
        )}

        {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        {/* Filtres */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Recherche</label>
              <div className="relative mt-1">
                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, prénom, email, téléphone..."
                  className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Statut</label>
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
              <label className="block text-sm font-medium text-gray-700">Commercial</label>
              <select
                value={assignedCommercialFilter}
                onChange={(e) => setAssignedCommercialFilter(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Tous les commerciaux</option>
                {(isAdmin
                  ? users.filter((u) => u.role !== 'USER')
                  : users.filter(
                      (u) => u.role === 'COMMERCIAL' || u.role === 'ADMIN' || u.role === 'MANAGER',
                    )
                ).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Télépro</label>
              <select
                value={assignedTeleproFilter}
                onChange={(e) => setAssignedTeleproFilter(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Tous les télépros</option>
                {(isAdmin
                  ? users.filter((u) => u.role !== 'USER')
                  : users.filter(
                      (u) => u.role === 'TELEPRO' || u.role === 'ADMIN' || u.role === 'MANAGER',
                    )
                ).map((user) => (
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
          <ContactTableSkeleton />
        ) : contacts.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <div className="text-4xl sm:text-6xl">👥</div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900 sm:text-xl">
              Aucun contact trouvé
            </h2>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              {search || statusFilter || assignedCommercialFilter || assignedTeleproFilter
                ? 'Aucun contact ne correspond à vos critères'
                : 'Commencez par ajouter votre premier contact'}
            </p>
            {!search && !statusFilter && !assignedCommercialFilter && !assignedTeleproFilter && (
              <button
                onClick={handleNewContact}
                className="mt-6 cursor-pointer rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:text-base"
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
                    <div className="flex items-center gap-1">
                      COMMERCIAL
                      <Filter className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
                    <div className="flex items-center gap-1">
                      TÉLÉPRO
                      <Filter className="h-3 w-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
                    Créé le
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
                    Modifié le
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase sm:px-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => router.push(`/contacts/${contact.id}`)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                          {contact.isCompany ? (
                            <span className="text-xs font-bold">🏢</span>
                          ) : (
                            (contact.firstName?.[0] || contact.lastName?.[0] || '?').toUpperCase()
                          )}
                        </div>
                        <div className="ml-3 min-w-0 sm:ml-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {contact.civility && `${contact.civility}. `}
                              {contact.firstName} {contact.lastName}
                            </span>
                            {contact.isCompany && (
                              <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                Entreprise
                              </span>
                            )}
                          </div>
                          {contact.companyName && (
                            <div className="text-xs text-gray-500">
                              Entreprise: {contact.companyName}
                            </div>
                          )}
                          {!contact.companyName && contact.companyRelation && (
                            <div className="text-xs text-gray-500">
                              Entreprise:{' '}
                              {contact.companyRelation.firstName || contact.companyRelation.lastName || 'Sans nom'}
                            </div>
                          )}
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
                        <div className="mt-1 text-xs text-gray-500">{contact.secondaryPhone}</div>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap sm:px-6">
                      {contact.email ? (
                        <div className="flex items-center text-gray-900">
                          <Mail className="mr-2 h-4 w-4 text-gray-400" />
                          <span className="max-w-[200px] truncate">{contact.email}</span>
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
                    <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                      {contact.assignedCommercial ? (
                        <span className="text-sm text-gray-900">
                          {contact.assignedCommercial.name}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-orange-300 bg-orange-50 px-2 py-1 text-xs font-medium text-orange-800">
                          Non Attribué
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                      {contact.assignedTelepro ? (
                        <span className="text-sm text-gray-900">
                          {contact.assignedTelepro.name}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-orange-300 bg-orange-50 px-2 py-1 text-xs font-medium text-orange-800">
                          Non Attribué
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 sm:px-6">
                      {contact.createdAt ? formatDate(contact.createdAt) : '-'}
                    </td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 sm:px-6">
                      {contact.updatedAt ? formatDate(contact.updatedAt) : '-'}
                    </td>
                    <td className="px-3 py-4 text-right text-sm font-medium whitespace-nowrap sm:px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(contact);
                          }}
                          className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(contact.id);
                            }}
                            className="cursor-pointer rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white p-6 shadow-xl sm:p-8">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  {editingContact ? 'Modifier le contact' : 'Nouveau contact'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingContact(null);
                    setError('');
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
                    <label className="block text-sm font-medium text-gray-700">Civilité</label>
                    <select
                      value={formData.civility}
                      onChange={(e) => setFormData({ ...formData, civility: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">-</option>
                      <option value="M">M.</option>
                      <option value="MME">Mme</option>
                      <option value="MLLE">Mlle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prénom</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Prénom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700">Téléphone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="123 Rue de la République"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ville</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Paris"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Code postal</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="75001"
                    />
                  </div>
                </div>
              </div>

              {/* Entreprise */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Entreprise</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isCompany"
                      checked={formData.isCompany}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isCompany: e.target.checked,
                          companyId: e.target.checked ? formData.companyId : '',
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="isCompany" className="ml-2 text-sm font-medium text-gray-700">
                      Ce contact est une entreprise
                    </label>
                  </div>

                  {!formData.isCompany && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Entreprise associée
                      </label>
                      <select
                        value={formData.companyId}
                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">Aucune entreprise</option>
                        {contacts
                          .filter((c) => c.isCompany)
                          .map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.firstName || company.lastName || 'Entreprise sans nom'}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Autres informations */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Autres informations</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Entreprise</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Nom de l'entreprise"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Origine du contact
                    </label>
                    <input
                      type="text"
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Site web, recommandation, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                    <select
                      value={formData.statusId}
                      onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700">Commercial</label>
                    <select
                      value={formData.assignedCommercialId}
                      onChange={(e) =>
                        setFormData({ ...formData, assignedCommercialId: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">Non assigné</option>
                      {(isAdmin
                        ? users.filter((u) => u.role !== 'USER')
                        : users.filter(
                            (u) =>
                              u.role === 'COMMERCIAL' || u.role === 'ADMIN' || u.role === 'MANAGER',
                          )
                      ).map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Télépro</label>
                    <select
                      value={formData.assignedTeleproId}
                      onChange={(e) =>
                        setFormData({ ...formData, assignedTeleproId: e.target.value })
                      }
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">Non assigné</option>
                      {(isAdmin
                        ? users.filter((u) => u.role !== 'USER')
                        : users.filter(
                            (u) =>
                              u.role === 'TELEPRO' || u.role === 'ADMIN' || u.role === 'MANAGER',
                          )
                      ).map((user) => (
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
                    setError('');
                  }}
                  className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="contact-form"
                  className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto"
                >
                  {editingContact ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'import */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl">
            {/* En-tête */}
            <div className="shrink-0 border-b border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Importer des contacts</h2>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportPreview([]);
                    setImportHeaders([]);
                    setImportMapping({});
                    setImportResult(null);
                    setError('');
                  }}
                  className="cursor-pointer rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!importFile ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Sélectionner un fichier (CSV ou Excel)
                  </label>
                  <div className="mt-1 flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <label className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:outline-none hover:text-indigo-500">
                          <span>Téléverser un fichier</span>
                          <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileSelect}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">ou glissez-déposez</p>
                      </div>
                      <p className="text-xs leading-5 text-gray-600">
                        CSV, XLSX ou XLS jusqu'à 10MB
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Fichier sélectionné */}
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{importFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(importFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setImportFile(null);
                          setImportPreview([]);
                          setImportHeaders([]);
                          setImportMapping({});
                          setImportResult(null);
                        }}
                        className="cursor-pointer rounded-lg p-1 text-gray-400 transition-colors hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Options */}
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={importSkipFirstRow}
                        onChange={(e) => setImportSkipFirstRow(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">
                        La première ligne contient les en-têtes
                      </span>
                    </label>
                  </div>

                  {/* Mapping des colonnes */}
                  {importHeaders.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Mapper les colonnes
                      </h3>
                      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                        {[
                          { key: 'phone', label: 'Téléphone', required: true },
                          { key: 'firstName', label: 'Prénom', required: false },
                          { key: 'lastName', label: 'Nom', required: false },
                          { key: 'email', label: 'Email', required: false },
                          { key: 'civility', label: 'Civilité', required: false },
                          { key: 'secondaryPhone', label: 'Téléphone secondaire', required: false },
                          { key: 'address', label: 'Adresse', required: false },
                          { key: 'city', label: 'Ville', required: false },
                          { key: 'postalCode', label: 'Code postal', required: false },
                          { key: 'origin', label: 'Origine', required: false },
                        ].map((field) => (
                          <div key={field.key} className="flex items-center gap-3">
                            <label className="w-40 text-sm text-gray-700">
                              {field.label}
                              {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <select
                              value={importMapping[field.key] || ''}
                              onChange={(e) =>
                                setImportMapping({ ...importMapping, [field.key]: e.target.value })
                              }
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                              <option value="">-- Sélectionner une colonne --</option>
                              {importHeaders.map((header) => (
                                <option key={header} value={header}>
                                  {header}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prévisualisation */}
                  {importPreview.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Aperçu (5 premières lignes)
                      </h3>
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {importHeaders.map((header) => (
                                <th
                                  key={header}
                                  className="px-4 py-2 text-left text-xs font-medium text-gray-700"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {importPreview.map((row, idx) => (
                              <tr key={idx}>
                                {importHeaders.map((header) => (
                                  <td
                                    key={header}
                                    className="px-4 py-2 text-xs whitespace-nowrap text-gray-900"
                                  >
                                    {row[header] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Résultat de l'import */}
                  {importResult && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <h3 className="mb-2 text-sm font-semibold text-green-900">
                        Résultat de l'import
                      </h3>
                      <ul className="space-y-1 text-sm text-green-800">
                        <li>✓ {importResult.imported} contact(s) importé(s)</li>
                        {importResult.skipped > 0 && (
                          <li className="text-yellow-700">
                            ⚠ {importResult.skipped} ligne(s) ignorée(s)
                          </li>
                        )}
                        {importResult.duplicates > 0 && (
                          <li className="text-orange-700">
                            ⚠ {importResult.duplicates} doublon(s) détecté(s)
                          </li>
                        )}
                        {importResult.errors > 0 && (
                          <li className="text-red-700">✗ {importResult.errors} erreur(s)</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
                  )}
                </div>
              )}
            </div>

            {/* Pied de modal */}
            {importFile && (
              <div className="shrink-0 border-t border-gray-100 px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFile(null);
                      setImportPreview([]);
                      setImportHeaders([]);
                      setImportMapping({});
                      setImportResult(null);
                      setError('');
                    }}
                    className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                    disabled={importing}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importing || !importMapping.phone}
                    className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {importing ? 'Import en cours...' : 'Importer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
