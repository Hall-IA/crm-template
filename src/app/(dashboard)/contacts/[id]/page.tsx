'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { PageHeader } from '@/components/page-header';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Edit,
  Trash2,
  Plus,
  ArrowLeft,
  PhoneCall,
  MessageSquare,
  Mail as MailIcon,
  Calendar as CalendarIcon,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { Editor, type DefaultTemplateRef } from '@/components/editor';

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

interface Interaction {
  id: string;
  type: 'CALL' | 'SMS' | 'EMAIL' | 'MEETING' | 'NOTE';
  title: string | null;
  content: string;
  date: string | null;
  userId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
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
  interactions: Interaction[];
}

export default function ContactDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const contactId = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const emailEditorRef = useRef<DefaultTemplateRef | null>(null);

  // Formulaire d'édition
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
    statusId: '',
    assignedUserId: '',
  });

  // Formulaire d'interaction
  const [interactionData, setInteractionData] = useState({
    type: 'NOTE' as 'CALL' | 'SMS' | 'EMAIL' | 'MEETING' | 'NOTE',
    title: '',
    content: '',
    date: '',
  });

  // Formulaire d'email
  const [emailData, setEmailData] = useState({
    subject: '',
    content: '',
  });

  // Charger les données
  useEffect(() => {
    if (contactId) {
      fetchContact();
      fetchStatuses();
      fetchUsers();
    }
  }, [contactId]);

  const fetchContact = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contacts/${contactId}`);
      if (response.ok) {
        const data = await response.json();
        setContact(data);
        setFormData({
          civility: data.civility || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone,
          secondaryPhone: data.secondaryPhone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          postalCode: data.postalCode || '',
          origin: data.origin || '',
          statusId: data.statusId || '',
          assignedUserId: data.assignedUserId || '',
        });
      } else {
        setError('Contact non trouvé');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement du contact');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await fetch('/api/statuses');
      if (response.ok) {
        const data = await response.json();
        setStatuses(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statuts:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/list');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.phone) {
      setError('Le téléphone est obligatoire');
      return;
    }

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          civility: formData.civility || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      setShowEditModal(false);
      fetchContact();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      router.push('/contacts');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInteractionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!interactionData.content) {
      setError('Le contenu est requis');
      return;
    }

    try {
      const url = editingInteraction
        ? `/api/contacts/${contactId}/interactions/${editingInteraction.id}`
        : `/api/contacts/${contactId}/interactions`;
      const method = editingInteraction ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...interactionData,
          date: interactionData.date || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setShowInteractionModal(false);
      setEditingInteraction(null);
      setInteractionData({
        type: 'NOTE',
        title: '',
        content: '',
        date: '',
      });
      fetchContact();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInteractionDelete = async (interactionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette interaction ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contacts/${contactId}/interactions/${interactionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      fetchContact();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (newStatusId: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          statusId: newStatusId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du statut');
      }

      // Mettre à jour le formulaire et recharger le contact
      setFormData({ ...formData, statusId: newStatusId || '' });
      fetchContact();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSendingEmail(true);

    try {
      const htmlContent = await emailEditorRef.current?.getHTML();
      console.log(htmlContent);
      const plainText = (htmlContent || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!emailData.subject || !plainText) {
        setError('Le sujet et le contenu sont requis');
        setSendingEmail(false);
        return;
      }

      const response = await fetch(`/api/contacts/${contactId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailData.subject,
          content: htmlContent || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de l'email");
      }

      setShowEmailModal(false);
      setEmailData({ subject: '', content: '' });
      setSuccess('Email envoyé avec succès !');
      fetchContact(); // Recharger pour afficher la nouvelle interaction

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <PhoneCall className="h-5 w-5" />;
      case 'SMS':
        return <MessageSquare className="h-5 w-5" />;
      case 'EMAIL':
        return <MailIcon className="h-5 w-5" />;
      case 'MEETING':
        return <CalendarIcon className="h-5 w-5" />;
      case 'NOTE':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getInteractionLabel = (type: string) => {
    switch (type) {
      case 'CALL':
        return 'Appel';
      case 'SMS':
        return 'SMS';
      case 'EMAIL':
        return 'Email';
      case 'MEETING':
        return 'RDV';
      case 'NOTE':
        return 'Note';
      default:
        return 'Note';
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (error && !contact) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-red-600">{error}</div>
          <Link
            href="/contacts"
            className="mt-4 inline-block cursor-pointer text-indigo-600 hover:text-indigo-700"
          >
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  if (!contact) {
    return null;
  }

  return (
    <div className="h-full">
      <PageHeader
        title={
          `${contact.civility ? `${contact.civility}. ` : ''}${contact.firstName || ''} ${contact.lastName || ''}`.trim() ||
          'Contact'
        }
        description="Détails du contact"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowEditModal(true);
                setError('');
              }}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Edit className="mr-2 inline h-4 w-4" />
              Modifier
            </button>
            <button
              onClick={handleDelete}
              className="cursor-pointer rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
            >
              <Trash2 className="mr-2 inline h-4 w-4" />
              Supprimer
            </button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <Link
          href="/contacts"
          className="mb-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Link>

        {error && <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-600">{success}</div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Informations principales */}
          <div className="space-y-6 lg:col-span-2">
            {/* Informations de contact */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Informations de contact</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Phone className="mt-1 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Téléphone</p>
                    <p className="text-sm text-gray-900">{contact.phone}</p>
                    {contact.secondaryPhone && (
                      <p className="mt-1 text-sm text-gray-500">
                        Secondaire: {contact.secondaryPhone}
                      </p>
                    )}
                  </div>
                </div>

                {contact.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="mt-1 h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-sm text-gray-900">{contact.email}</p>
                      <button
                        onClick={() => {
                          setShowEmailModal(true);
                          setEmailData({ subject: '', content: '' });
                          setError('');
                          setSuccess('');
                        }}
                        className="mt-2 cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
                      >
                        <MailIcon className="mr-1 inline h-3 w-3" />
                        Envoyer un email
                      </button>
                    </div>
                  </div>
                )}

                {(contact.address || contact.city) && (
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <MapPin className="mt-1 h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Adresse</p>
                      <p className="text-sm text-gray-900">
                        {contact.address && `${contact.address}, `}
                        {contact.postalCode && `${contact.postalCode} `}
                        {contact.city}
                      </p>
                    </div>
                  </div>
                )}

                {contact.origin && (
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <User className="mt-1 h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Origine</p>
                      <p className="text-sm text-gray-900">{contact.origin}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Historique des interactions */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Historique des interactions</h2>
                <button
                  onClick={() => {
                    setShowInteractionModal(true);
                    setEditingInteraction(null);
                    setInteractionData({
                      type: 'NOTE',
                      title: '',
                      content: '',
                      date: '',
                    });
                    setError('');
                  }}
                  className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  <Plus className="mr-2 inline h-4 w-4" />
                  Ajouter
                </button>
              </div>

              {contact.interactions.length === 0 ? (
                <div className="py-8 text-center text-gray-500">Aucune interaction enregistrée</div>
              ) : (
                <div className="space-y-4">
                  {contact.interactions.map((interaction) => (
                    <div key={interaction.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-1 items-start gap-3">
                          <div className="mt-1 text-indigo-600">
                            {getInteractionIcon(interaction.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {getInteractionLabel(interaction.type)}
                              </span>
                              {interaction.title && (
                                <span className="text-sm text-gray-600">- {interaction.title}</span>
                              )}
                            </div>
                            <p className="mt-1 text-sm whitespace-pre-wrap text-gray-700">
                              {interaction.content}
                            </p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                              <span>Par {interaction.user.name}</span>
                              {interaction.date && (
                                <span>
                                  <Calendar className="mr-1 inline h-3 w-3" />
                                  {new Date(interaction.date).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                              <span>
                                {new Date(interaction.createdAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex gap-2">
                          <button
                            onClick={() => {
                              setEditingInteraction(interaction);
                              setInteractionData({
                                type: interaction.type,
                                title: interaction.title || '',
                                content: interaction.content,
                                date: interaction.date
                                  ? new Date(interaction.date).toISOString().split('T')[0]
                                  : '',
                              });
                              setShowInteractionModal(true);
                              setError('');
                            }}
                            className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleInteractionDelete(interaction.id)}
                            className="cursor-pointer rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statut et assignation */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Statut</h2>
              <select
                value={contact.statusId || ''}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Aucun statut</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
              {contact.status && (
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: contact.status.color }}
                  />
                  <span className="text-xs text-gray-500">{contact.status.name}</span>
                </div>
              )}

              <h2 className="mt-6 mb-4 text-lg font-semibold text-gray-900">Assignation</h2>
              {contact.assignedUser ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    {contact.assignedUser.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{contact.assignedUser.name}</p>
                    <p className="text-xs text-gray-500">{contact.assignedUser.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Non assigné</p>
              )}

              <h2 className="mt-6 mb-4 text-lg font-semibold text-gray-900">Créé par</h2>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                  {contact.createdBy.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{contact.createdBy.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(contact.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl [-ms-overflow-style:none] [scrollbar-width:none] sm:p-8 [&::-webkit-scrollbar]:hidden">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Modifier le contact</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setError('');
                }}
                className="cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-gray-100"
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

            <form onSubmit={handleUpdate} className="space-y-6">
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

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
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ville</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Code postal</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

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
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                    <label className="block text-sm font-medium text-gray-700">Assigné à</label>
                    <select
                      value={formData.assignedUserId}
                      onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
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

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setError('');
                  }}
                  className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'interaction */}
      {showInteractionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {editingInteraction ? "Modifier l'interaction" : 'Nouvelle interaction'}
              </h2>
              <button
                onClick={() => {
                  setShowInteractionModal(false);
                  setEditingInteraction(null);
                  setError('');
                }}
                className="cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-gray-100"
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

            <form onSubmit={handleInteractionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type *</label>
                <select
                  value={interactionData.type}
                  onChange={(e) =>
                    setInteractionData({
                      ...interactionData,
                      type: e.target.value as any,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="NOTE">Note</option>
                  <option value="CALL">Appel</option>
                  <option value="SMS">SMS</option>
                  <option value="EMAIL">Email</option>
                  <option value="MEETING">RDV</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Titre</label>
                <input
                  type="text"
                  value={interactionData.title}
                  onChange={(e) =>
                    setInteractionData({ ...interactionData, title: e.target.value })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Titre de l'interaction (optionnel)"
                />
              </div>

              {(interactionData.type === 'MEETING' || interactionData.type === 'CALL') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="datetime-local"
                    value={interactionData.date}
                    onChange={(e) =>
                      setInteractionData({ ...interactionData, date: e.target.value })
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Contenu *</label>
                <textarea
                  required
                  rows={6}
                  value={interactionData.content}
                  onChange={(e) =>
                    setInteractionData({ ...interactionData, content: e.target.value })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Détails de l'interaction..."
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
              )}

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowInteractionModal(false);
                    setEditingInteraction(null);
                    setError('');
                  }}
                  className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto"
                >
                  {editingInteraction ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'envoi d'email */}
      {showEmailModal && contact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Envoyer un email</h2>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailData({ subject: '', content: '' });
                  setError('');
                }}
                className="cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-gray-100"
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

            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">À :</span> {contact.email}
              </p>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sujet *</label>
                <input
                  type="text"
                  required
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Sujet de l'email"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Message *</label>
                <Editor ref={emailEditorRef} />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
              )}

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailData({ subject: '', content: '' });
                    setError('');
                  }}
                  className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {sendingEmail ? 'Envoi en cours...' : "Envoyer l'email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
