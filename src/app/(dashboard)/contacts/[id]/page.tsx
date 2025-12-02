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
  Video,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Editor, type DefaultTemplateRef } from '@/components/editor';
import { useUserRole } from '@/hooks/use-user-role';

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
  const { isAdmin } = useUserRole();
  const contactId = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const emailEditorRef = useRef<DefaultTemplateRef | null>(null);
  const taskEditorRef = useRef<DefaultTemplateRef | null>(null);
  const interactionEditorRef = useRef<DefaultTemplateRef | null>(null);

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

  // Formulaire de tâche
  const [taskData, setTaskData] = useState({
    type: 'CALL' as 'CALL' | 'MEETING' | 'EMAIL' | 'OTHER',
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    scheduledAt: '',
    assignedUserId: '',
    reminderMinutesBefore: null as number | null,
  });

  // Modal Google Meet
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [creatingMeet, setCreatingMeet] = useState(false);
  const [meetData, setMeetData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    durationMinutes: 30,
    attendees: [] as string[],
    reminderMinutesBefore: null as number | null,
  });
  const meetEditorRef = useRef<DefaultTemplateRef | null>(null);
  const [googleAccountConnected, setGoogleAccountConnected] = useState(false);

  // Modal d'édition Google Meet
  const [showEditMeetModal, setShowEditMeetModal] = useState(false);
  const [editingMeetTask, setEditingMeetTask] = useState<any | null>(null);
  const [editMeetData, setEditMeetData] = useState<{
    scheduledAt: string;
    durationMinutes: number;
  }>({
    scheduledAt: '',
    durationMinutes: 30,
  });
  const [editMeetLoading, setEditMeetLoading] = useState(false);
  const [editMeetError, setEditMeetError] = useState('');

  // Charger les données
  useEffect(() => {
    if (contactId) {
      fetchContact();
      fetchStatuses();
      fetchUsers();
      fetchTasks();
    }
  }, [contactId]);

  // Vérifier si Google est connecté
  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const response = await fetch('/api/auth/google/status');
        if (response.ok) {
          const data = await response.json();
          setGoogleAccountConnected(data.connected);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de Google:', error);
      }
    };
    checkGoogleConnection();
  }, []);

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

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?contactId=${contactId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
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

    // Récupérer le contenu depuis l'éditeur riche et le convertir en texte brut
    let contentText = '';
    if (interactionEditorRef.current) {
      const html = interactionEditorRef.current.getHTML() || '';
      contentText = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\u00A0/g, ' ')
        .trim();
    }

    if (!contentText) {
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
          content: contentText,
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
      interactionEditorRef.current?.injectHTML('');
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreatingTask(true);

    try {
      if (!taskEditorRef.current) {
        setError('L\'éditeur n\'est pas prêt. Veuillez réessayer.');
        setCreatingTask(false);
        return;
      }

      const htmlContent = await taskEditorRef.current.getHTML();
      
      // Vérifier si l'éditeur contient vraiment du contenu
      const hasContent = htmlContent && htmlContent.trim() !== '' && 
        htmlContent.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() !== '';
      
      const plainText = (htmlContent || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!taskData.scheduledAt) {
        setError('La date/heure est requise');
        setCreatingTask(false);
        return;
      }

      if (!hasContent || !plainText) {
        setError('La description est requise');
        setCreatingTask(false);
        return;
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: taskData.type,
          title: taskData.title || null,
          description: htmlContent || '',
          priority: taskData.priority,
          scheduledAt: taskData.scheduledAt,
          contactId: contactId,
          assignedUserId: taskData.assignedUserId || undefined,
          reminderMinutesBefore: taskData.reminderMinutesBefore ?? null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création de la tâche");
      }

      setShowTaskModal(false);
      setTaskData({
        type: 'CALL',
        title: '',
        description: '',
        priority: 'MEDIUM',
        scheduledAt: '',
        assignedUserId: '',
        reminderMinutesBefore: null,
      });
      setSuccess('Tâche créée avec succès !');
      fetchContact(); // Recharger pour afficher la nouvelle interaction

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingTask(false);
    }
  };

  const handleCreateMeet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreatingMeet(true);

    try {
      if (!meetEditorRef.current) {
        setError('L\'éditeur n\'est pas prêt. Veuillez réessayer.');
        setCreatingMeet(false);
        return;
      }

      const htmlContent = await meetEditorRef.current.getHTML();
      
      // Vérifier si l'éditeur contient vraiment du contenu
      const hasContent = htmlContent && htmlContent.trim() !== '' && 
        htmlContent.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() !== '';
      
      const plainText = (htmlContent || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!meetData.scheduledAt) {
        setError('La date/heure est requise');
        setCreatingMeet(false);
        return;
      }

      if (!meetData.title) {
        setError('Le titre est requis');
        setCreatingMeet(false);
        return;
      }

      const response = await fetch(`/api/contacts/${contactId}/meet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: meetData.title,
          description: htmlContent || '',
          scheduledAt: meetData.scheduledAt,
          durationMinutes: meetData.durationMinutes,
          attendees: meetData.attendees.filter((email) => email.trim() !== ''),
          reminderMinutesBefore: meetData.reminderMinutesBefore,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création du Google Meet");
      }

      setShowMeetModal(false);
      setMeetData({
        title: '',
        description: '',
        scheduledAt: '',
        durationMinutes: 30,
        attendees: [],
        reminderMinutesBefore: null,
      });
      setSuccess('Google Meet créé avec succès !');
      fetchContact(); // Recharger pour afficher la nouvelle tâche/interaction
      fetchTasks(); // Recharger les tâches pour afficher le lien

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingMeet(false);
    }
  };

  const handleUpdateMeet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeetTask) return;

    setEditMeetError('');
    setEditMeetLoading(true);

    try {
      if (!editMeetData.scheduledAt) {
        setEditMeetError('La date/heure est requise');
        setEditMeetLoading(false);
        return;
      }

      const response = await fetch(`/api/tasks/${editingMeetTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: editMeetData.scheduledAt,
          durationMinutes: editMeetData.durationMinutes,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour du Google Meet");
      }

      setShowEditMeetModal(false);
      setEditingMeetTask(null);
      setSuccess('Google Meet modifié avec succès !');
      fetchContact();
      fetchTasks();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setEditMeetError(err.message);
    } finally {
      setEditMeetLoading(false);
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

  const sanitizeHtml = (html: string) => {
    if (typeof window === 'undefined') return html;
    const container = document.createElement('div');
    container.innerHTML = html;

    // Supprimer les balises dangereuses
    container.querySelectorAll('script, style').forEach((el) => el.remove());

    // Supprimer les attributs on* et les urls javascript:
    container.querySelectorAll<HTMLElement>('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        if (/^on/i.test(attr.name)) {
          el.removeAttribute(attr.name);
        }
        if (typeof attr.value === 'string' && attr.value.trim().toLowerCase().startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return container.innerHTML;
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
                            <div
                              className="mt-1 text-sm text-gray-700"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(interaction.content) }}
                            />
                            {/* Afficher le lien Google Meet si disponible */}
                            {(() => {
                              // Chercher la tâche correspondante à cette interaction
                              const relatedTask = tasks.find(
                                (task) =>
                                  task.contactId === contactId &&
                                  task.type === 'MEETING' &&
                                  task.googleMeetLink &&
                                  interaction.type === 'MEETING' &&
                                  interaction.title?.includes('Google Meet')
                              );
                              const meetLink = relatedTask?.googleMeetLink;
                              return meetLink && relatedTask ? (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <a
                                    href={meetLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                                  >
                                    <Video className="h-4 w-4" />
                                    <span>Rejoindre Google Meet</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const scheduled = new Date(relatedTask.scheduledAt);
                                      setEditMeetData({
                                        scheduledAt: scheduled.toISOString(),
                                        durationMinutes: relatedTask.durationMinutes ?? 30,
                                      });
                                      setEditingMeetTask(relatedTask);
                                      setEditMeetError('');
                                      setShowEditMeetModal(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Modifier le rendez-vous
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (
                                        !confirm(
                                          'Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Le contact sera notifié de l\'annulation.'
                                        )
                                      ) {
                                        return;
                                      }

                                      try {
                                        const response = await fetch(`/api/tasks/${relatedTask.id}`, {
                                          method: 'DELETE',
                                        });

                                        if (!response.ok) {
                                          const data = await response.json();
                                          throw new Error(data.error || 'Erreur lors de la suppression');
                                        }

                                        setSuccess('Rendez-vous supprimé avec succès !');
                                        fetchContact();
                                        fetchTasks();

                                        setTimeout(() => setSuccess(''), 5000);
                                      } catch (err: any) {
                                        setError(err.message);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Supprimer le rendez-vous
                                  </button>
                                </div>
                              ) : null;
                            })()}
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

              <div className="mt-6 space-y-2">
                <button
                  onClick={() => {
                    setShowTaskModal(true);
                    setTaskData({
                      type: 'CALL',
                      title: '',
                      description: '',
                      priority: 'MEDIUM',
                      scheduledAt: '',
                      assignedUserId: '',
                      reminderMinutesBefore: null
                    });
                    setError('');
                    setSuccess('');
                  }}
                  className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  <CalendarIcon className="mr-2 inline h-4 w-4" />
                  Créer une tâche
                </button>
                {googleAccountConnected && (
                  <button
                    onClick={() => {
                      setShowMeetModal(true);
                      setMeetData({
                        title: contact
                          ? `RDV avec ${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                          : '',
                        description: '',
                        scheduledAt: '',
                        durationMinutes: 30,
                        attendees: contact?.email ? [contact.email] : [],
                        reminderMinutesBefore: null,
                      });
                      setError('');
                      setSuccess('');
                    }}
                    className="w-full cursor-pointer rounded-lg border border-indigo-600 bg-white px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                  >
                    <MailIcon className="mr-2 inline h-4 w-4" />
                    Programmer un Google Meet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl p-6 sm:p-8">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Modifier le contact</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setError('');
                  }}
                  className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100"
                  type="button"
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
              id="edit-form"
              onSubmit={handleUpdate}
              className="flex-1 space-y-6 overflow-y-auto pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
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
            </form>

            {/* Pied de modal fixe */}
            <div className="shrink-0 border-t border-gray-100 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
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
                  form="edit-form"
                  className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'interaction */}
      {showInteractionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl p-6 sm:p-8">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  {editingInteraction ? "Modifier l'interaction" : 'Nouvelle interaction'}
                </h2>
                <button
                  onClick={() => {
                    setShowInteractionModal(false);
                    setEditingInteraction(null);
                    setError('');
                  }}
                  className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100"
                  type="button"
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
              id="interaction-form"
              onSubmit={handleInteractionSubmit}
              className="flex-1 space-y-4 overflow-y-auto pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
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

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Contenu *</label>
                <Editor
                  ref={interactionEditorRef}
                  onReady={(methods) => {
                    interactionEditorRef.current = methods;
                    if (interactionData.content) {
                      const html = interactionData.content
                        .split('\n')
                        .map((line) => line || '<br>')
                        .join('<br>');
                      methods.injectHTML(html);
                    }
                  }}
                />
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
                  form="interaction-form"
                  className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto"
                >
                  {editingInteraction ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'envoi d'email */}
      {showEmailModal && contact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl p-6 sm:p-8">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Envoyer un email</h2>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailData({ subject: '', content: '' });
                    setError('');
                  }}
                  className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100"
                  type="button"
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
              id="email-form"
              onSubmit={handleSendEmail}
              className="flex-1 space-y-4 overflow-y-auto pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">À :</span> {contact.email}
                </p>
              </div>
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
            </form>

            {/* Pied de modal fixe */}
            <div className="shrink-0 border-t border-gray-100 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
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
                  form="email-form"
                  disabled={sendingEmail}
                  className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {sendingEmail ? 'Envoi en cours...' : "Envoyer l'email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création de tâche */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl p-6">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                    Créer une tâche
                  </h2>
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                    Pour{' '}
                    <span className="font-medium text-gray-900">
                      {`${contact.firstName || ''} ${contact.lastName || ''}`.trim() ||
                        contact.phone}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setTaskData({
                      type: 'CALL',
                      title: '',
                      description: '',
                      priority: 'MEDIUM',
                      scheduledAt: '',
                      assignedUserId: '',
                      reminderMinutesBefore: null
                    });
                    setError('');
                  }}
                  className="cursor-pointer rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Fermer la modal"
                  type="button"
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

            {/* Contenu scrollable */}
            <form
              id="task-form"
              onSubmit={handleCreateTask}
              className="flex-1 space-y-8 overflow-y-auto pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Titre de la tâche *
                </label>
                <input
                  type="text"
                  value={taskData.title}
                  onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ex : Appeler le client pour devis"
                  required
                />
              </div>

              {/* Type de tâche */}
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Type de tâche</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[
                    {
                      value: 'CALL' as const,
                      label: 'Appel téléphonique',
                      icon: <PhoneCall className="h-5 w-5" />,
                    },
                    {
                      value: 'MEETING' as const,
                      label: 'RDV',
                      icon: <CalendarIcon className="h-5 w-5" />,
                    },
                    {
                      value: 'EMAIL' as const,
                      label: 'Email',
                      icon: <MailIcon className="h-5 w-5" />,
                    },
                    {
                      value: 'NOTE' as const,
                      label: 'Suivi',
                      icon: <FileText className="h-5 w-5" />,
                    },
                    {
                      value: 'OTHER' as const,
                      label: 'Autre',
                      icon: <User className="h-5 w-5" />,
                    },
                  ].map((option) => {
                    const isActive = taskData.type === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setTaskData({
                            ...taskData,
                            type:
                              option.value === 'NOTE'
                                ? ('OTHER' as 'CALL' | 'MEETING' | 'EMAIL' | 'OTHER')
                                : option.value,
                          })
                        }
                        className={`cursor-pointer flex flex-col items-center justify-center rounded-xl border px-3 py-3 text-xs font-medium transition-colors sm:text-sm ${
                          isActive
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/60'
                        }`}
                      >
                        <span
                          className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full border text-base ${
                            isActive
                              ? 'border-indigo-500 bg-white text-indigo-600'
                              : 'border-gray-200 bg-gray-50 text-gray-500'
                          }`}
                        >
                          {option.icon}
                        </span>
                        <span className="text-center leading-snug">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & heure + priorité */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Date & heure *</p>
                  <div className="grid grid-cols-[3fr,2fr] gap-2">
                    <input
                      type="date"
                      required
                      value={taskData.scheduledAt ? taskData.scheduledAt.split('T')[0] : ''}
                      onChange={(e) => {
                        const time =
                          taskData.scheduledAt && taskData.scheduledAt.includes('T')
                            ? taskData.scheduledAt.split('T')[1]
                            : '';
                        setTaskData({
                          ...taskData,
                          scheduledAt: time ? `${e.target.value}T${time}` : `${e.target.value}T09:00`,
                        });
                      }}
                      className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <input
                      type="time"
                      value={
                        taskData.scheduledAt && taskData.scheduledAt.includes('T')
                          ? taskData.scheduledAt.split('T')[1].slice(0, 5)
                          : ''
                      }
                      onChange={(e) => {
                        const datePart =
                          taskData.scheduledAt && taskData.scheduledAt.includes('T')
                            ? taskData.scheduledAt.split('T')[0]
                            : new Date().toISOString().split('T')[0];
                        setTaskData({
                          ...taskData,
                          scheduledAt: `${datePart}T${e.target.value || '09:00'}`,
                        });
                      }}
                      className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Priorité</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { value: 'LOW' as const, label: 'Faible' },
                      { value: 'MEDIUM' as const, label: 'Moyenne' },
                      { value: 'HIGH' as const, label: 'Haute' },
                      { value: 'URGENT' as const, label: 'Urgente' },
                    ].map((option) => {
                      const isActive = taskData.priority === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setTaskData({
                              ...taskData,
                              priority: option.value,
                            })
                          }
                          className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                            isActive
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/60'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rappel */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Rappel</p>
                <select
                  value={taskData.reminderMinutesBefore ?? ''}
                  onChange={(e) =>
                    setTaskData({
                      ...taskData,
                      reminderMinutesBefore: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Aucun rappel</option>
                  <option value="5">5 minutes avant</option>
                  <option value="15">15 minutes avant</option>
                  <option value="30">30 minutes avant</option>
                  <option value="60">1 heure avant</option>
                  <option value="120">2 heures avant</option>
                </select>
              </div>

              {/* Attribution */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Attribuer à</label>
                <select
                  value={taskData.assignedUserId}
                  onChange={(e) => setTaskData({ ...taskData, assignedUserId: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">
                    Moi-même ({session?.user?.name || 'Utilisateur'})
                  </option>
                  {isAdmin &&
                    users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <Editor ref={taskEditorRef} />
                <p className="text-xs text-gray-500">
                  Ajoutez des détails sur cette tâche (contexte, points à aborder, informations
                  importantes…).
                </p>
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
                    setShowTaskModal(false);
                    setTaskData({
                      type: 'CALL',
                      title: '',
                      description: '',
                      priority: 'MEDIUM',
                      scheduledAt: '',
                      assignedUserId: '',
                      reminderMinutesBefore: null
                    });
                    setError('');
                  }}
                  className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="task-form"
                  disabled={creatingTask}
                  className="w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {creatingTask ? 'Création...' : 'Créer la tâche'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Google Meet */}
      {showMeetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl p-6 sm:p-8">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Programmer un Google Meet
                </h2>
                <button
                  onClick={() => {
                    setShowMeetModal(false);
                    setMeetData({
                      title: '',
                      description: '',
                      scheduledAt: '',
                      durationMinutes: 30,
                      attendees: [],
                      reminderMinutesBefore: null,
                    });
                    setError('');
                  }}
                  className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100"
                  type="button"
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
              id="meet-form"
              onSubmit={handleCreateMeet}
              className="flex-1 space-y-4 overflow-y-auto pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Titre de la réunion *
                </label>
                <input
                  type="text"
                  required
                  value={meetData.title}
                  onChange={(e) => setMeetData({ ...meetData, title: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ex: RDV avec..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Date & heure *</p>
                  <div className="grid grid-cols-[3fr,2fr] gap-2">
                    <input
                      type="date"
                      required
                      value={meetData.scheduledAt ? meetData.scheduledAt.split('T')[0] : ''}
                      onChange={(e) => {
                        const time =
                          meetData.scheduledAt && meetData.scheduledAt.includes('T')
                            ? meetData.scheduledAt.split('T')[1]
                            : '';
                        setMeetData({
                          ...meetData,
                          scheduledAt: time
                            ? `${e.target.value}T${time}`
                            : `${e.target.value}T09:00`,
                        });
                      }}
                      className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <input
                      type="time"
                      value={
                        meetData.scheduledAt && meetData.scheduledAt.includes('T')
                          ? meetData.scheduledAt.split('T')[1].slice(0, 5)
                          : ''
                      }
                      onChange={(e) => {
                        const datePart =
                          meetData.scheduledAt && meetData.scheduledAt.includes('T')
                            ? meetData.scheduledAt.split('T')[0]
                            : new Date().toISOString().split('T')[0];
                        setMeetData({
                          ...meetData,
                          scheduledAt: `${datePart}T${e.target.value || '09:00'}`,
                        });
                      }}
                      className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Durée (minutes)</p>
                  <select
                    value={meetData.durationMinutes}
                    onChange={(e) =>
                      setMeetData({
                        ...meetData,
                        durationMinutes: Number(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 heure</option>
                    <option value="90">1h30</option>
                    <option value="120">2 heures</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Rappel</label>
                <select
                  value={meetData.reminderMinutesBefore ?? ''}
                  onChange={(e) =>
                    setMeetData({
                      ...meetData,
                      reminderMinutesBefore: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Aucun rappel</option>
                  <option value="5">5 minutes avant</option>
                  <option value="15">15 minutes avant</option>
                  <option value="30">30 minutes avant</option>
                  <option value="60">1 heure avant</option>
                  <option value="120">2 heures avant</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Invités (emails, un par ligne)
                </label>
                <textarea
                  value={meetData.attendees.join('\n')}
                  onChange={(e) =>
                    setMeetData({
                      ...meetData,
                      attendees: e.target.value
                        .split('\n')
                        .map((email) => email.trim())
                        .filter((email) => email !== ''),
                    })
                  }
                  rows={4}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="email1@example.com&#10;email2@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Le contact sera automatiquement invité si son email est renseigné
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <Editor ref={meetEditorRef} />
                <p className="text-xs text-gray-500">
                  Ajoutez des détails sur cette réunion (ordre du jour, points à aborder…).
                </p>
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
                    setShowMeetModal(false);
                    setMeetData({
                      title: '',
                      description: '',
                      scheduledAt: '',
                      durationMinutes: 30,
                      attendees: [],
                      reminderMinutesBefore: null,
                    });
                    setError('');
                  }}
                  className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="meet-form"
                  disabled={creatingMeet}
                  className="w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {creatingMeet ? 'Création...' : 'Créer le Google Meet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition de Google Meet */}
      {showEditMeetModal && editingMeetTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg bg-white p-6 shadow-xl sm:p-8">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Modifier le Google Meet
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditMeetModal(false);
                    setEditingMeetTask(null);
                    setEditMeetError('');
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
              {editingMeetTask.contact && (
                <p className="mt-1 text-sm text-gray-500">
                  {editingMeetTask.contact.firstName} {editingMeetTask.contact.lastName}
                </p>
              )}
            </div>

            {/* Contenu scrollable */}
            <form
              id="edit-meet-form"
              onSubmit={handleUpdateMeet}
              className="flex-1 space-y-4 overflow-y-auto pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Date & heure *</p>
                <div className="grid grid-cols-[3fr,2fr] gap-2">
                  <input
                    type="date"
                    required
                    value={
                      editMeetData.scheduledAt
                        ? editMeetData.scheduledAt.split('T')[0]
                        : new Date(editingMeetTask.scheduledAt).toISOString().split('T')[0]
                    }
                    onChange={(e) => {
                      const time =
                        editMeetData.scheduledAt && editMeetData.scheduledAt.includes('T')
                          ? editMeetData.scheduledAt.split('T')[1]
                          : new Date(editingMeetTask.scheduledAt).toISOString().split('T')[1].slice(0, 5);
                      setEditMeetData({
                        ...editMeetData,
                        scheduledAt: `${e.target.value}T${time || '09:00'}`,
                      });
                    }}
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <input
                    type="time"
                    required
                    value={
                      editMeetData.scheduledAt && editMeetData.scheduledAt.includes('T')
                        ? editMeetData.scheduledAt.split('T')[1].slice(0, 5)
                        : new Date(editingMeetTask.scheduledAt).toISOString().split('T')[1].slice(0, 5)
                    }
                    onChange={(e) => {
                      const datePart =
                        editMeetData.scheduledAt && editMeetData.scheduledAt.includes('T')
                          ? editMeetData.scheduledAt.split('T')[0]
                          : new Date(editingMeetTask.scheduledAt).toISOString().split('T')[0];
                      setEditMeetData({
                        ...editMeetData,
                        scheduledAt: `${datePart}T${e.target.value || '09:00'}`,
                      });
                    }}
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Durée (minutes)
                </label>
                <select
                  value={editMeetData.durationMinutes}
                  onChange={(e) =>
                    setEditMeetData({
                      ...editMeetData,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 heure</option>
                  <option value={90}>1h30</option>
                  <option value={120}>2 heures</option>
                </select>
              </div>

              {editingMeetTask.googleMeetLink && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Lien Google Meet</p>
                  <a
                    href={editingMeetTask.googleMeetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    <Video className="h-4 w-4" />
                    <span className="truncate">{editingMeetTask.googleMeetLink}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {editMeetError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {editMeetError}
                </div>
              )}
            </form>

            {/* Pied de modal fixe */}
            <div className="shrink-0 border-t border-gray-100 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditMeetModal(false);
                    setEditingMeetTask(null);
                    setEditMeetError('');
                  }}
                  className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="edit-meet-form"
                  disabled={editMeetLoading}
                  className="w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {editMeetLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
