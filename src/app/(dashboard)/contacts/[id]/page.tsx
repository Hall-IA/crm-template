'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import {
  User,
  ArrowLeft,
  PhoneCall,
  MessageSquare,
  Mail as MailIcon,
  Calendar as CalendarIcon,
  FileText,
  Video,
  ExternalLink,
  Activity,
  RefreshCw,
  Settings,
  Plus,
  Tag,
  Edit,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { Editor, type DefaultTemplateRef } from '@/components/editor';
import { useUserRole } from '@/hooks/use-user-role';
import { useMobileMenuContext } from '@/contexts/mobile-menu-context';
import { replaceTemplateVariables } from '@/lib/template-variables';
import { cn } from '@/lib/utils';

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

interface Interaction {
  id: string;
  type:
    | 'CALL'
    | 'SMS'
    | 'EMAIL'
    | 'MEETING'
    | 'NOTE'
    | 'STATUS_CHANGE'
    | 'CONTACT_UPDATE'
    | 'APPOINTMENT_CREATED'
    | 'ASSIGNMENT_CHANGE';
  title: string | null;
  content: string;
  metadata: any | null;
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
  interactions: Interaction[];
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { isAdmin } = useUserRole();
  const { isOpen: isMobileMenuOpen, toggle: toggleMobileMenu } = useMobileMenuContext();
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
  const [companies, setCompanies] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [noteTemplates, setNoteTemplates] = useState<any[]>([]);
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
    company: '',
    isCompany: false,
    companyId: '',
    statusId: '',
    assignedCommercialId: '',
    assignedTeleproId: '',
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
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    content: '',
  });
  const [emailAttachments, setEmailAttachments] = useState<File[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // Formulaire de tâche
  const [taskData, setTaskData] = useState({
    type: 'CALL' as 'CALL' | 'MEETING' | 'EMAIL' | 'VIDEO_CONFERENCE' | 'NOTE',
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    scheduledAt: '',
    assignedUserId: '',
    reminderMinutesBefore: null as number | null,
    durationMinutes: 30,
    attendees: [] as string[],
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
    internalNote: '',
  });
  const meetEditorRef = useRef<DefaultTemplateRef | null>(null);
  const [googleAccountConnected, setGoogleAccountConnected] = useState(false);

  // Modal d'édition Google Meet
  const [showEditMeetModal, setShowEditMeetModal] = useState(false);
  const [editingMeetTask, setEditingMeetTask] = useState<any | null>(null);
  const [editMeetData, setEditMeetData] = useState<{
    scheduledAt: string;
    durationMinutes: number;
    attendees: string[];
  }>({
    scheduledAt: '',
    durationMinutes: 30,
    attendees: [],
  });
  const [editMeetLoading, setEditMeetLoading] = useState(false);
  const [editMeetError, setEditMeetError] = useState('');
  const [deleteMeetLoading, setDeleteMeetLoading] = useState(false);

  // Modal d'édition Rendez-vous
  const [showEditAppointmentModal, setShowEditAppointmentModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [editAppointmentData, setEditAppointmentData] = useState<{
    title: string;
    description: string;
    scheduledAt: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    assignedUserId: string;
    reminderMinutesBefore: number | null;
  }>({
    title: '',
    description: '',
    scheduledAt: '',
    priority: 'MEDIUM',
    assignedUserId: '',
    reminderMinutesBefore: null,
  });
  const [editAppointmentLoading, setEditAppointmentLoading] = useState(false);
  const [editAppointmentError, setEditAppointmentError] = useState('');
  const editAppointmentEditorRef = useRef<DefaultTemplateRef | null>(null);

  // Modal de visualisation d'activité
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [viewingActivity, setViewingActivity] = useState<Interaction | null>(null);

  // Modal de visualisation de rendez-vous
  const [showViewAppointmentModal, setShowViewAppointmentModal] = useState(false);
  const [viewingAppointment, setViewingAppointment] = useState<any | null>(null);
  const [deleteAppointmentLoading, setDeleteAppointmentLoading] = useState(false);

  // Modals spécifiques pour chaque action
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [creatingCall, setCreatingCall] = useState(false);
  const [creatingNote, setCreatingNote] = useState(false);

  // Données pour les modals spécifiques
  const [meetingData, setMeetingData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    assignedUserId: '',
    reminderMinutesBefore: null as number | null,
  });
  const [callData, setCallData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    assignedUserId: '',
    reminderMinutesBefore: null as number | null,
  });
  const [noteData, setNoteData] = useState({
    title: '',
    content: '',
    date: '',
  });
  const meetingEditorRef = useRef<DefaultTemplateRef | null>(null);
  const callEditorRef = useRef<DefaultTemplateRef | null>(null);
  const noteEditorRef = useRef<DefaultTemplateRef | null>(null);

  // État pour les onglets
  const [activeTab, setActiveTab] = useState<
    'activities' | 'notes' | 'calls' | 'files' | 'email' | 'appointments'
  >('activities');

  // Grouper les interactions par date (doit être avant les useEffect)
  // Séparer les interactions en activités et fil d'actualités
  const groupedActivities = useMemo(() => {
    if (!contact) return {};
    // Types d'activités : actions effectuées par l'utilisateur
    const activityTypes = ['EMAIL', 'CALL', 'SMS', 'NOTE', 'MEETING', 'APPOINTMENT_CREATED'];
    const activities = contact.interactions
      .filter((interaction) => activityTypes.includes(interaction.type))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const groups: { [key: string]: Interaction[] } = {};
    activities.forEach((interaction) => {
      const date = new Date(interaction.createdAt);
      const dateKey = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(interaction);
    });
    return groups;
  }, [contact]);

  // Grouper les notes par date
  const groupedNotes = useMemo(() => {
    if (!contact) return {};
    const notes = contact.interactions
      .filter((interaction) => interaction.type === 'NOTE')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const groups: { [key: string]: Interaction[] } = {};
    notes.forEach((interaction) => {
      const date = new Date(interaction.createdAt);
      const dateKey = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(interaction);
    });
    return groups;
  }, [contact]);

  // Grouper les appels par date
  const groupedCalls = useMemo(() => {
    if (!contact) return {};
    const calls = contact.interactions
      .filter((interaction) => interaction.type === 'CALL')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const groups: { [key: string]: Interaction[] } = {};
    calls.forEach((interaction) => {
      const date = new Date(interaction.createdAt);
      const dateKey = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(interaction);
    });
    return groups;
  }, [contact]);

  // Grouper les emails par date
  const groupedEmails = useMemo(() => {
    if (!contact) return {};
    const emails = contact.interactions
      .filter((interaction) => interaction.type === 'EMAIL')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const groups: { [key: string]: Interaction[] } = {};
    emails.forEach((interaction) => {
      const date = new Date(interaction.createdAt);
      const dateKey = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(interaction);
    });
    return groups;
  }, [contact]);

  const groupedNewsFeed = useMemo(() => {
    if (!contact) return {};
    // Types de fil d'actualités : modifications du contact
    const newsFeedTypes = ['STATUS_CHANGE', 'CONTACT_UPDATE', 'ASSIGNMENT_CHANGE'];
    const newsFeed = contact.interactions
      .filter((interaction) => newsFeedTypes.includes(interaction.type))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const groups: { [key: string]: Interaction[] } = {};
    newsFeed.forEach((interaction) => {
      const date = new Date(interaction.createdAt);
      const dateKey = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(interaction);
    });
    return groups;
  }, [contact]);

  // Charger les données
  useEffect(() => {
    if (contactId) {
      fetchContact();
      fetchStatuses();
      fetchUsers();
      fetchCompanies();
      fetchTemplates();
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

  // Injecter la description dans l'éditeur lorsque la modal d'édition de rendez-vous s'ouvre
  useEffect(() => {
    if (showEditAppointmentModal && editingAppointment) {
      // Attendre que l'éditeur soit monté avant d'injecter le contenu
      const timer = setTimeout(() => {
        if (editAppointmentEditorRef.current) {
          const description = editingAppointment.description || '';
          editAppointmentEditorRef.current.injectHTML(description);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showEditAppointmentModal, editingAppointment]);

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
          company: data.companyName || '',
          isCompany: data.isCompany || false,
          companyId: data.companyId || '',
          statusId: data.statusId || '',
          assignedCommercialId: data.assignedCommercialId || '',
          assignedTeleproId: data.assignedTeleproId || '',
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

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/contacts?isCompany=true');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.contacts || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des entreprises:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const [emailResponse, noteResponse] = await Promise.all([
        fetch('/api/templates?type=EMAIL'),
        fetch('/api/templates?type=NOTE'),
      ]);

      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        setEmailTemplates(emailData);
      }

      if (noteResponse.ok) {
        const noteData = await noteResponse.json();
        setNoteTemplates(noteData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
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
          secondaryPhone: formData.secondaryPhone || null,
          address: formData.address || null,
          city: formData.city || null,
          postalCode: formData.postalCode || null,
          origin: formData.origin || null,
          company: formData.company || null,
          isCompany: formData.isCompany || false,
          companyId: formData.companyId || null,
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

  const handleDeleteContact = async () => {
    // Vérifier que l'utilisateur est administrateur
    if (!isAdmin) {
      setError('Seuls les administrateurs peuvent supprimer un contact');
      return;
    }

    if (
      !confirm('Êtes-vous sûr de vouloir supprimer ce contact ? Cette action est irréversible.')
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      // Rediriger vers la liste des contacts après suppression
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
      const plainText = (htmlContent || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!emailData.to || !emailData.to.trim()) {
        setError('Le destinataire (À) est requis');
        setSendingEmail(false);
        return;
      }

      if (!emailData.subject || !plainText) {
        setError('Le sujet et le contenu sont requis');
        setSendingEmail(false);
        return;
      }

      // Créer FormData pour envoyer les fichiers
      const formData = new FormData();
      formData.append('to', emailData.to);
      formData.append('cc', emailData.cc || '');
      formData.append('bcc', emailData.bcc || '');
      formData.append('subject', emailData.subject);
      formData.append('content', htmlContent || '');

      // Ajouter les pièces jointes
      emailAttachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });
      formData.append('attachmentCount', emailAttachments.length.toString());

      const response = await fetch(`/api/contacts/${contactId}/send-email`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de l'email");
      }

      setShowEmailModal(false);
      setEmailData({ to: '', cc: '', bcc: '', subject: '', content: '' });
      setEmailAttachments([]);
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
        setError("L'éditeur n'est pas prêt. Veuillez réessayer.");
        setCreatingTask(false);
        return;
      }

      const htmlContent = await taskEditorRef.current.getHTML();

      // Vérifier si l'éditeur contient vraiment du contenu
      const hasContent =
        htmlContent &&
        htmlContent.trim() !== '' &&
        htmlContent
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim() !== '';

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

      // Créer une tâche (type générique, utilisé pour EMAIL et NOTE)
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
        throw new Error(data.error || 'Erreur lors de la création de la tâche');
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
        durationMinutes: 30,
        attendees: [],
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

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreatingMeeting(true);

    try {
      if (!meetingEditorRef.current) {
        setError("L'éditeur n'est pas prêt. Veuillez réessayer.");
        setCreatingMeeting(false);
        return;
      }

      const htmlContent = await meetingEditorRef.current.getHTML();
      const plainText = (htmlContent || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!meetingData.scheduledAt) {
        setError('La date/heure est requise');
        setCreatingMeeting(false);
        return;
      }

      if (!plainText) {
        setError('La description est requise');
        setCreatingMeeting(false);
        return;
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MEETING',
          title: meetingData.title || null,
          description: htmlContent || '',
          priority: meetingData.priority,
          scheduledAt: meetingData.scheduledAt,
          contactId: contactId,
          assignedUserId: meetingData.assignedUserId || undefined,
          reminderMinutesBefore: meetingData.reminderMinutesBefore ?? null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du rendez-vous');
      }

      setShowMeetingModal(false);
      setMeetingData({
        title: '',
        description: '',
        scheduledAt: '',
        priority: 'MEDIUM',
        assignedUserId: '',
        reminderMinutesBefore: null,
      });
      setSuccess('Rendez-vous créé avec succès !');
      fetchContact();
      fetchTasks();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingMeeting(false);
    }
  };

  const handleCreateCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreatingCall(true);

    try {
      if (!callEditorRef.current) {
        setError("L'éditeur n'est pas prêt. Veuillez réessayer.");
        setCreatingCall(false);
        return;
      }

      const htmlContent = await callEditorRef.current.getHTML();
      const plainText = (htmlContent || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!callData.scheduledAt) {
        setError('La date/heure est requise');
        setCreatingCall(false);
        return;
      }

      if (!plainText) {
        setError('La description est requise');
        setCreatingCall(false);
        return;
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CALL',
          title: callData.title || null,
          description: htmlContent || '',
          priority: callData.priority,
          scheduledAt: callData.scheduledAt,
          contactId: contactId,
          assignedUserId: callData.assignedUserId || undefined,
          reminderMinutesBefore: callData.reminderMinutesBefore ?? null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création de la tâche d'appel");
      }

      setShowCallModal(false);
      setCallData({
        title: '',
        description: '',
        scheduledAt: '',
        priority: 'MEDIUM',
        assignedUserId: '',
        reminderMinutesBefore: null,
      });
      setSuccess("Tâche d'appel créée avec succès !");
      fetchContact();
      fetchTasks();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingCall(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let htmlContent = '';
    let contentText = '';
    if (noteEditorRef.current) {
      htmlContent = noteEditorRef.current.getHTML() || '';
      contentText = htmlContent
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
      // Préparer les métadonnées avec le HTML
      const metadata: any = {};
      if (htmlContent) {
        metadata.htmlContent = htmlContent;
      }

      const response = await fetch(`/api/contacts/${contactId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NOTE',
          title: noteData.title || null,
          content: contentText,
          date: noteData.date || null,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la note');
      }

      setShowNoteModal(false);
      setNoteData({
        title: '',
        content: '',
        date: '',
      });
      noteEditorRef.current?.injectHTML('');
      setSuccess('Note créée avec succès !');
      fetchContact();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateMeet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreatingMeet(true);

    try {
      if (!meetEditorRef.current) {
        setError("L'éditeur n'est pas prêt. Veuillez réessayer.");
        setCreatingMeet(false);
        return;
      }

      const htmlContent = await meetEditorRef.current.getHTML();

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
          internalNote: meetData.internalNote || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du Google Meet');
      }

      setShowMeetModal(false);
      setMeetData({
        title: '',
        description: '',
        scheduledAt: '',
        durationMinutes: 30,
        attendees: [],
        reminderMinutesBefore: null,
        internalNote: '',
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

      // Convertir la date locale en ISO string pour l'API
      const scheduledDate = new Date(editMeetData.scheduledAt);
      const isoString = scheduledDate.toISOString();

      // Mettre à jour via l'API tasks (les Google Meets sont des tâches de type VIDEO_CONFERENCE)
      const response = await fetch(`/api/tasks/${editingMeetTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: isoString,
          durationMinutes: editMeetData.durationMinutes,
          attendees: editMeetData.attendees.filter((email) => email.trim() !== ''),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du Google Meet');
      }

      setShowEditMeetModal(false);
      setEditingMeetTask(null);
      setEditMeetData({
        scheduledAt: '',
        durationMinutes: 30,
        attendees: [],
      });
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

  const handleDeleteMeet = async () => {
    if (!editingMeetTask) return;

    // Demander confirmation
    if (
      !confirm(
        'Êtes-vous sûr de vouloir supprimer ce Google Meet ? Le contact sera automatiquement informé par email.',
      )
    ) {
      return;
    }

    setDeleteMeetLoading(true);
    setEditMeetError('');

    try {
      const response = await fetch(`/api/tasks/${editingMeetTask.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression du Google Meet');
      }

      setShowEditMeetModal(false);
      setEditingMeetTask(null);
      setEditMeetData({
        scheduledAt: '',
        durationMinutes: 30,
        attendees: [],
      });
      setSuccess('Google Meet supprimé avec succès ! Le contact a été informé par email.');
      fetchContact();
      fetchTasks();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setEditMeetError(err.message);
    } finally {
      setDeleteMeetLoading(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!viewingAppointment) return;

    // Demander confirmation
    if (
      !confirm(
        'Êtes-vous sûr de vouloir annuler ce rendez-vous ? Une interaction sera créée dans le fil d\'actualité.',
      )
    ) {
      return;
    }

    setDeleteAppointmentLoading(true);

    try {
      const response = await fetch(`/api/tasks/${viewingAppointment.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'annulation du rendez-vous');
      }

      setShowViewAppointmentModal(false);
      setViewingAppointment(null);
      setSuccess('Rendez-vous annulé avec succès !');
      fetchContact();
      fetchTasks();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleteAppointmentLoading(false);
    }
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditAppointmentError('');
    setEditAppointmentLoading(true);

    try {
      if (!editingAppointment) {
        throw new Error('Rendez-vous non trouvé');
      }

      if (!editAppointmentEditorRef.current) {
        throw new Error("L'éditeur n'est pas prêt");
      }

      const htmlContent = await editAppointmentEditorRef.current.getHTML();

      const response = await fetch(`/api/tasks/${editingAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editAppointmentData.title || null,
          description: htmlContent || '',
          scheduledAt: editAppointmentData.scheduledAt,
          priority: editAppointmentData.priority,
          assignedUserId: editAppointmentData.assignedUserId || undefined,
          reminderMinutesBefore: editAppointmentData.reminderMinutesBefore,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification');
      }

      setShowEditAppointmentModal(false);
      setEditingAppointment(null);
      setEditAppointmentData({
        title: '',
        description: '',
        scheduledAt: '',
        priority: 'MEDIUM',
        assignedUserId: '',
        reminderMinutesBefore: null,
      });
      setSuccess('Rendez-vous modifié avec succès !');
      fetchContact();
      fetchTasks();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setEditAppointmentError(err.message);
    } finally {
      setEditAppointmentLoading(false);
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <PhoneCall className="h-5 w-5 text-green-600" />;
      case 'SMS':
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      case 'EMAIL':
        return <MailIcon className="h-5 w-5 text-blue-600" />;
      case 'MEETING':
        return <CalendarIcon className="h-5 w-5 text-yellow-600" />;
      case 'NOTE':
        return <FileText className="h-5 w-5 text-gray-600" />;
      case 'STATUS_CHANGE':
        return <Tag className="h-5 w-5 text-purple-600" />;
      case 'CONTACT_UPDATE':
        return <Edit className="h-5 w-5 text-indigo-600" />;
      case 'APPOINTMENT_CREATED':
        return <CalendarIcon className="h-5 w-5 text-orange-600" />;
      case 'ASSIGNMENT_CHANGE':
        return <User className="h-5 w-5 text-teal-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
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
        return 'Rendez-vous';
      case 'NOTE':
        return 'Note';
      case 'STATUS_CHANGE':
        return 'Changement de statut';
      case 'CONTACT_UPDATE':
        return 'Modification';
      case 'APPOINTMENT_CREATED':
        return 'Rendez-vous créé';
      case 'ASSIGNMENT_CHANGE':
        return "Changement d'assignation";
      default:
        return 'Interaction';
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        {/* Skeleton Header */}
        <div className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Skeleton Burger Button */}
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-gray-200 lg:hidden" />
              {/* Skeleton Title */}
              <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
          {/* Skeleton Breadcrumbs */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        {/* Skeleton Back Link */}
        <div className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        </div>

        {/* Skeleton Profile Section */}
        <div className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Skeleton Avatar */}
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-gray-200 sm:h-16 sm:w-16" />
              <div className="min-w-0 flex-1 space-y-2">
                {/* Skeleton Name */}
                <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
                {/* Skeleton Company */}
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
            {/* Skeleton Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200 sm:w-40" />
            </div>
          </div>
        </div>

        {/* Skeleton Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 p-4 lg:flex-row lg:p-6">
            {/* Skeleton Left Column - Form */}
            <div className="w-full space-y-4 lg:w-1/3">
              <div className="rounded-lg bg-white p-3 shadow sm:p-4">
                <div className="space-y-3">
                  {/* Skeleton Form Fields */}
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                      <div className="h-9 w-full animate-pulse rounded-lg bg-gray-200" />
                    </div>
                  ))}
                  {/* Skeleton Save Button */}
                  <div className="pt-3">
                    <div className="h-9 w-full animate-pulse rounded-lg bg-gray-200" />
                  </div>
                </div>
              </div>
            </div>

            {/* Skeleton Right Column - Tabs */}
            <div className="flex-1">
              {/* Skeleton Card with Tabs and Content */}
              <div className="rounded-lg bg-white shadow">
                {/* Skeleton Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex flex-wrap space-x-4 sm:space-x-8">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 w-20 animate-pulse rounded bg-gray-200" />
                    ))}
                  </div>
                </div>

                {/* Skeleton Tab Content */}
                <div className="p-4 sm:p-6">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="h-9 w-40 animate-pulse rounded-lg bg-gray-200" />
                  </div>
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-3">
                        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
                        <div className="space-y-3">
                          {[...Array(2)].map((_, j) => (
                            <div key={j} className="rounded-lg border border-gray-200 p-3 sm:p-4">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <div className="h-5 w-5 shrink-0 animate-pulse rounded bg-gray-200" />
                                <div className="min-w-0 flex-1 space-y-2">
                                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                                  <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                                  <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

  const contactInitial = (contact.firstName?.[0] || contact.lastName?.[0] || '?').toUpperCase();
  const contactName =
    `${contact.civility ? `${contact.civility}. ` : ''}${contact.firstName || ''} ${contact.lastName || ''}`.trim() ||
    contact.phone;

  // Filtrer les interactions par type
  const notes = contact.interactions.filter((i) => i.type === 'NOTE');

  return (
    <div className="flex h-full flex-col">
      {/* Header avec Contacts et badge */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Bouton burger pour mobile */}
            <button
              onClick={toggleMobileMenu}
              className="shrink-0 cursor-pointer rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 lg:hidden"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-gray-900 sm:text-lg">Contacts</h1>
              {/* <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs sm:text-sm font-medium text-indigo-700">
                125
              </span> */}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={fetchContact}
              className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
              title="Actualiser"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            {isAdmin && (
              <button
                onClick={handleDeleteContact}
                className="cursor-pointer rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                title="Supprimer le contact"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        {/* Breadcrumbs */}
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-700">
            Accueil
          </Link>
          <span>/</span>
          <Link href="/contacts" className="hover:text-gray-700">
            Contacts
          </Link>
        </div>
      </div>

      {/* Lien Back to Contacts */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/contacts"
          className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour aux contacts</span>
        </Link>
      </div>

      {/* Section Profil avec badges */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-600 sm:h-16 sm:w-16 sm:text-xl">
              {contactInitial}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                {contactName}
              </h2>
              {contact.companyName && (
                <p className="mt-1 truncate text-xs text-gray-500 sm:text-sm">
                  {contact.companyName}
                </p>
              )}
              {!contact.companyName && contact.companyRelation && (
                <p className="mt-1 truncate text-xs text-gray-500 sm:text-sm">
                  {contact.companyRelation.firstName || contact.companyRelation.lastName || 'Entreprise sans nom'}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                setShowTaskModal(true);
                setTaskData({
                  type: 'EMAIL',
                  title: '',
                  description: '',
                  priority: 'MEDIUM',
                  scheduledAt: '',
                  assignedUserId: '',
                  reminderMinutesBefore: null,
                  durationMinutes: 30,
                  attendees: [],
                });
                setError('');
                setSuccess('');
              }}
              className="cursor-pointer rounded-lg bg-gray-900 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800 sm:px-4 sm:py-2 sm:text-sm"
            >
              <Plus className="mr-1 inline h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Tâche</span>
            </button>
            <button
              onClick={() => {
                setShowMeetingModal(true);
                setMeetingData({
                  title: '',
                  description: '',
                  scheduledAt: '',
                  priority: 'MEDIUM',
                  assignedUserId: '',
                  reminderMinutesBefore: null,
                });
                setError('');
                setSuccess('');
              }}
              className="cursor-pointer rounded-lg bg-blue-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 sm:px-4 sm:py-2 sm:text-sm"
              title="Créer un Rendez-vous"
            >
              <CalendarIcon className="mr-1 inline h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Rendez-vous</span>
            </button>
            <button
              onClick={() => {
                setShowMeetModal(true);
                setMeetData({
                  title: '',
                  description: '',
                  scheduledAt: '',
                  durationMinutes: 30,
                  attendees: [],
                  reminderMinutesBefore: null,
                  internalNote: '',
                });
                setError('');
                setSuccess('');
              }}
              className="cursor-pointer rounded-lg bg-indigo-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 sm:px-4 sm:py-2 sm:text-sm"
              title="Créer un Google Meet"
            >
              <Video className="mr-1 inline h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Visio-conférence</span>
              <span className="sm:hidden">Meet</span>
            </button>
            <Link
              href={'tel:' + contact.phone}
              className="cursor-pointer rounded-lg bg-green-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 sm:px-4 sm:py-2 sm:text-sm"
              title="Créer un appel"
            >
              <PhoneCall className="mr-1 inline h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Appeler</span>
            </Link>
            <button
              onClick={() => {
                setShowEmailModal(true);
                setEmailData({
                  to: contact.email || '',
                  cc: '',
                  bcc: '',
                  subject: '',
                  content: '',
                });
                setEmailAttachments([]);
                setShowCc(false);
                setShowBcc(false);
                setError('');
                setSuccess('');
              }}
              className="cursor-pointer rounded-lg bg-blue-500 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600 sm:px-4 sm:py-2 sm:text-sm"
              title="Envoyer un email"
            >
              <MailIcon className="mr-1 inline h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Email</span>
            </button>
            <button
              onClick={() => {
                setShowNoteModal(true);
                setNoteData({
                  title: '',
                  content: '',
                  date: '',
                });
                setError('');
              }}
              className="cursor-pointer rounded-lg bg-gray-600 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700 sm:px-4 sm:py-2 sm:text-sm"
              title="Créer une note"
            >
              <FileText className="mr-1 inline h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages d'erreur/succès */}
      {error && (
        <div className="mx-4 mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 sm:mx-6 lg:mx-8">
          {error}
        </div>
      )}

      {success && (
        <div className="mx-4 mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-600 sm:mx-6 lg:mx-8">
          {success}
        </div>
      )}

      {/* Contenu principal - Deux colonnes */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 p-4 lg:flex-row lg:p-6">
          {/* Colonne gauche - Formulaire (sticky) */}
          <div className="w-full space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-1/3 lg:self-start lg:overflow-y-auto lg:pb-4">
            <div className="rounded-lg bg-white p-3 shadow sm:p-4">
              {/* Formulaire */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowEditModal(true);
                }}
                className="space-y-3"
              >
                {/* Civilité */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Civilité</label>
                  <div className="flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="civility"
                        value="M"
                        checked={formData.civility === 'M'}
                        onChange={(e) => setFormData({ ...formData, civility: e.target.value })}
                        className="cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">M.</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="civility"
                        value="MME"
                        checked={formData.civility === 'MME'}
                        onChange={(e) => setFormData({ ...formData, civility: e.target.value })}
                        className="cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">Mme</span>
                    </label>
                  </div>
                </div>

                {/* Prénom */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Prénom</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Nom */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nom</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Téléphone secondaire - Affiché seulement si présent */}
                {contact?.secondaryPhone && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Téléphone secondaire
                    </label>
                    <input
                      type="tel"
                      value={formData.secondaryPhone}
                      onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Adresse - Toujours affichée si présente */}
                {(contact?.address || contact?.city || contact?.postalCode) && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Adresse</label>
                    <div className="space-y-2">
                      {contact?.address && (
                        <input
                          type="text"
                          value={formData.address || ''}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Adresse"
                          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {contact?.city && (
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Ville
                            </label>
                            <input
                              type="text"
                              value={formData.city || ''}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              placeholder="Ville"
                              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                        )}
                        {contact?.postalCode && (
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Code postal
                            </label>
                            <input
                              type="text"
                              value={formData.postalCode || ''}
                              onChange={(e) =>
                                setFormData({ ...formData, postalCode: e.target.value })
                              }
                              placeholder="Code postal"
                              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Entreprise - Toujours affichée */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Entreprise
                  </label>
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Nom de l'entreprise"
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Campagne d'origine - Toujours affichée */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Campagne d'origine
                  </label>
                  <input
                    type="text"
                    value={formData.origin || ''}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="Origine du contact"
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>


                {/* Statut */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Statut</label>
                  <select
                    value={formData.statusId || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, statusId: e.target.value });
                      handleStatusChange(e.target.value);
                    }}
                    className="w-full cursor-pointer rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    style={
                      contact.status
                        ? {
                            backgroundColor: `${contact.status.color}20`,
                            color: contact.status.color,
                            borderColor: contact.status.color,
                          }
                        : {}
                    }
                  >
                    <option value="">Aucun statut</option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Commercial */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Commercial</label>
                  <select
                    value={formData.assignedCommercialId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedCommercialId: e.target.value })
                    }
                    className="w-full cursor-pointer rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Non attribué</option>
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

                {/* Télépro */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Télépro</label>
                  <select
                    value={formData.assignedTeleproId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedTeleproId: e.target.value })
                    }
                    className="w-full cursor-pointer rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Non attribué</option>
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

                {/* Bouton Enregistrer */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      await handleUpdate(e);
                    }}
                    className="w-full cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Colonne droite - Onglets et activités */}
          <div className="flex-1">
            {/* Carte blanche contenant les onglets et le contenu */}
            <div className="rounded-lg bg-white shadow">
              {/* Onglets */}
              <div className="border-b border-gray-200">
                <nav className="flex flex-wrap" aria-label="Tabs">
                  {[
                    { id: 'activities' as const, label: 'Activités', icon: Activity },
                    { id: 'appointments' as const, label: 'Rendez-vous', icon: CalendarIcon },
                    { id: 'notes' as const, label: 'Notes', icon: FileText },
                    { id: 'calls' as const, label: 'Appels', icon: PhoneCall },
                    { id: 'files' as const, label: 'Fichiers', icon: FileText },
                    { id: 'email' as const, label: 'Email', icon: MailIcon },
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-4 text-sm font-medium transition-colors sm:gap-2 sm:px-6 ${
                          activeTab === tab.id
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                      >
                        <TabIcon className="h-4 w-4 shrink-0" />
                        <span className="whitespace-nowrap">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Contenu des onglets */}
              <div className="p-4 sm:p-6">
                {activeTab === 'activities' && (
                  <div className="space-y-8">
                    {/* Section Activités */}
                    <div>
                      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Activités</h2>
                      </div>
                      <div className="space-y-4">
                        {Object.keys(groupedActivities).length === 0 ? (
                          <p className="py-6 text-center text-sm text-gray-500">Aucune activité</p>
                        ) : (
                          Object.entries(groupedActivities).map(([date, interactions]) => (
                            <div key={date}>
                              <h3 className="mb-3 text-sm font-semibold text-gray-700">{date}</h3>
                              <div className="space-y-2">
                                {interactions.map((interaction) => {
                                  const getCardColor = (type: string) => {
                                    switch (type) {
                                      case 'EMAIL':
                                        return 'bg-blue-50 border-blue-200';
                                      case 'CALL':
                                        return 'bg-green-50 border-green-200';
                                      case 'SMS':
                                        return 'bg-blue-50 border-blue-200';
                                      case 'NOTE':
                                        return 'bg-gray-50 border-gray-200';
                                      case 'MEETING':
                                        return 'bg-yellow-50 border-yellow-200';
                                      case 'APPOINTMENT_CREATED':
                                        return 'bg-orange-50 border-orange-200';
                                      default:
                                        return 'bg-gray-50 border-gray-200';
                                    }
                                  };
                                  return (
                                    <div
                                      key={interaction.id}
                                      onClick={() => {
                                        setViewingActivity(interaction);
                                        setShowActivityModal(true);
                                      }}
                                      className={cn(
                                        'relative cursor-pointer rounded-lg border p-2.5 transition-colors hover:shadow-md sm:p-3',
                                        getCardColor(interaction.type),
                                      )}
                                    >
                                      <div className="flex items-start gap-2">
                                        <div className="mt-0.5 shrink-0">
                                          {getInteractionIcon(interaction.type)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="wrap-break-words text-sm font-medium text-gray-900">
                                            {getInteractionLabel(interaction.type)}
                                            {interaction.title && `: ${interaction.title}`}
                                          </p>
                                          {interaction.content && (
                                            <p className="wrap-break-words mt-1 line-clamp-2 text-xs text-gray-700">
                                              {interaction.content
                                                .replace(/<[^>]+>/g, '')
                                                .substring(0, 100)}
                                              {interaction.content.replace(/<[^>]+>/g, '').length >
                                                100 && '...'}
                                            </p>
                                          )}
                                          <div className="mt-1.5 flex items-center justify-between">
                                            <p className="text-xs text-gray-500">
                                              {new Date(interaction.createdAt).toLocaleTimeString(
                                                'fr-FR',
                                                {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                },
                                              )}
                                            </p>
                                            {interaction.user && (
                                              <p className="text-xs text-gray-500">
                                                Par :{' '}
                                                {interaction.user.name || interaction.user.email}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Section Fil d'actualités */}
                    <div>
                      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Fil d'actualités</h2>
                      </div>
                      <div className="space-y-4">
                        {Object.keys(groupedNewsFeed).length === 0 ? (
                          <p className="py-6 text-center text-sm text-gray-500">
                            Aucune modification
                          </p>
                        ) : (
                          Object.entries(groupedNewsFeed).map(([date, interactions]) => (
                            <div key={date}>
                              <h3 className="mb-3 text-sm font-semibold text-gray-700">{date}</h3>
                              <div className="space-y-2">
                                {interactions.map((interaction) => {
                                  const getCardColor = (type: string) => {
                                    switch (type) {
                                      case 'STATUS_CHANGE':
                                        return 'bg-purple-50 border-purple-200';
                                      case 'CONTACT_UPDATE':
                                        return 'bg-indigo-50 border-indigo-200';
                                      case 'ASSIGNMENT_CHANGE':
                                        return 'bg-teal-50 border-teal-200';
                                      default:
                                        return 'bg-gray-50 border-gray-200';
                                    }
                                  };
                                  return (
                                    <div
                                      key={interaction.id}
                                      className={cn(
                                        'relative rounded-lg border p-3 sm:p-4',
                                        getCardColor(interaction.type),
                                      )}
                                    >
                                      <div className="flex items-start gap-2 sm:gap-3">
                                        <div className="mt-0.5 shrink-0">
                                          {getInteractionIcon(interaction.type)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="wrap-break-words text-sm font-medium text-gray-900">
                                            {getInteractionLabel(interaction.type)}
                                            {interaction.title && `: ${interaction.title}`}
                                          </p>
                                          {interaction.content && (
                                            <p className="wrap-break-words mt-1 text-sm text-gray-700">
                                              {interaction.content.replace(/<[^>]+>/g, '')}
                                            </p>
                                          )}
                                          <div className="mt-2 flex items-center justify-between">
                                            <p className="text-sm text-gray-500">
                                              {new Date(interaction.createdAt).toLocaleTimeString(
                                                'fr-FR',
                                                {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                },
                                              )}
                                            </p>
                                            {interaction.user && (
                                              <p className="text-xs text-gray-500">
                                                Par :{' '}
                                                {interaction.user.name || interaction.user.email}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appointments' && (
                  <div>
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">Rendez-vous</h2>
                    </div>
                    <div className="space-y-4">
                      {(() => {
                        // Filtrer les tâches pour ne garder que les Rendez-vous (MEETING et VIDEO_CONFERENCE)
                        const appointments = tasks.filter(
                          (task) => task.type === 'MEETING' || task.type === 'VIDEO_CONFERENCE',
                        );

                        if (appointments.length === 0) {
                          return (
                            <p className="py-8 text-center text-sm text-gray-500">
                              Aucun rendez-vous
                            </p>
                          );
                        }

                        // Trier par date (plus récent en premier)
                        const sortedAppointments = [...appointments].sort(
                          (a, b) =>
                            new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
                        );

                        return sortedAppointments.map((appointment) => {
                          const scheduledDate = new Date(appointment.scheduledAt);
                          const isPast = scheduledDate < new Date();
                          const isVideoConference = appointment.type === 'VIDEO_CONFERENCE';

                          return (
                            <div
                              key={appointment.id}
                              className={`cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-50 ${
                                isPast
                                  ? 'border-gray-200 bg-gray-50'
                                  : 'border-gray-200 bg-white shadow-sm'
                              }`}
                              onClick={() => {
                                // Ouvrir le modal de visualisation
                                setViewingAppointment(appointment);
                                setShowViewAppointmentModal(true);
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {isVideoConference ? (
                                      <Video className="h-5 w-5 text-indigo-600" />
                                    ) : (
                                      <CalendarIcon className="h-5 w-5 text-yellow-600" />
                                    )}
                                    <h3 className="text-sm font-semibold text-gray-900">
                                      {appointment.title || 'Rendez-vous'}
                                    </h3>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                        isVideoConference
                                          ? 'bg-indigo-100 text-indigo-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                      }`}
                                    >
                                      {isVideoConference ? 'Google Meet' : 'Rendez-vous physique'}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {scheduledDate.toLocaleDateString('fr-FR', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}{' '}
                                    à{' '}
                                    {scheduledDate.toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                  {appointment.description && (
                                    <p
                                      className="mt-2 line-clamp-2 text-sm text-gray-600"
                                      dangerouslySetInnerHTML={{ __html: appointment.description }}
                                    />
                                  )}
                                  {appointment.internalNote && (
                                    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-2">
                                      <p className="mb-1 text-xs font-medium text-blue-900">
                                        📝 Note personnelle
                                      </p>
                                      <p className="text-xs whitespace-pre-wrap text-blue-800">
                                        {appointment.internalNote}
                                      </p>
                                    </div>
                                  )}
                                  {isVideoConference && appointment.googleMeetLink && (
                                    <a
                                      href={appointment.googleMeetLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Rejoindre la réunion
                                    </a>
                                  )}
                                </div>
                                <Edit className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div>
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                    </div>
                    <div className="space-y-4">
                      {Object.keys(groupedNotes).length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-500">Aucune note</p>
                      ) : (
                        Object.entries(groupedNotes).map(([date, interactions]) => (
                          <div key={date}>
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">{date}</h3>
                            <div className="space-y-2">
                              {interactions.map((interaction) => (
                                <div
                                  key={interaction.id}
                                  onClick={() => {
                                    setViewingActivity(interaction);
                                    setShowActivityModal(true);
                                  }}
                                  className="relative cursor-pointer rounded-lg border border-gray-200 bg-gray-50 p-2.5 transition-colors hover:shadow-md sm:p-3"
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="mt-0.5 shrink-0">
                                      {getInteractionIcon(interaction.type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="wrap-break-words text-sm font-medium text-gray-900">
                                        {getInteractionLabel(interaction.type)}
                                        {interaction.title && `: ${interaction.title}`}
                                      </p>
                                      {interaction.content && (
                                        <p className="wrap-break-words mt-1 line-clamp-2 text-xs text-gray-700">
                                          {interaction.content
                                            .replace(/<[^>]+>/g, '')
                                            .substring(0, 100)}
                                          {interaction.content.replace(/<[^>]+>/g, '').length >
                                            100 && '...'}
                                        </p>
                                      )}
                                      <div className="mt-1.5 flex items-center justify-between">
                                        <p className="text-xs text-gray-500">
                                          {new Date(interaction.createdAt).toLocaleTimeString(
                                            'fr-FR',
                                            {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            },
                                          )}
                                        </p>
                                        {interaction.user && (
                                          <p className="text-xs text-gray-500">
                                            Par : {interaction.user.name || interaction.user.email}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'calls' && (
                  <div>
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">Appels</h2>
                    </div>
                    <div className="space-y-4">
                      {Object.keys(groupedCalls).length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-500">Aucun appel</p>
                      ) : (
                        Object.entries(groupedCalls).map(([date, interactions]) => (
                          <div key={date}>
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">{date}</h3>
                            <div className="space-y-2">
                              {interactions.map((interaction) => (
                                <div
                                  key={interaction.id}
                                  onClick={() => {
                                    setViewingActivity(interaction);
                                    setShowActivityModal(true);
                                  }}
                                  className="relative cursor-pointer rounded-lg border border-green-200 bg-green-50 p-2.5 transition-colors hover:shadow-md sm:p-3"
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="mt-0.5 shrink-0">
                                      {getInteractionIcon(interaction.type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="wrap-break-words text-sm font-medium text-gray-900">
                                        {getInteractionLabel(interaction.type)}
                                        {interaction.title && `: ${interaction.title}`}
                                      </p>
                                      {interaction.content && (
                                        <p className="wrap-break-words mt-1 line-clamp-2 text-xs text-gray-700">
                                          {interaction.content
                                            .replace(/<[^>]+>/g, '')
                                            .substring(0, 100)}
                                          {interaction.content.replace(/<[^>]+>/g, '').length >
                                            100 && '...'}
                                        </p>
                                      )}
                                      <div className="mt-1.5 flex items-center justify-between">
                                        <p className="text-xs text-gray-500">
                                          {interaction.date
                                            ? new Date(interaction.date).toLocaleTimeString(
                                                'fr-FR',
                                                {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                },
                                              )
                                            : new Date(interaction.createdAt).toLocaleTimeString(
                                                'fr-FR',
                                                {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                },
                                              )}
                                        </p>
                                        {interaction.user && (
                                          <p className="text-xs text-gray-500">
                                            Par : {interaction.user.name || interaction.user.email}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'files' && (
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Fichiers</h3>
                    </div>
                    <p className="py-8 text-center text-sm text-gray-500">Aucun fichier</p>
                  </div>
                )}

                {activeTab === 'email' && (
                  <div>
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">Email</h2>
                    </div>
                    <div className="space-y-4">
                      {Object.keys(groupedEmails).length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-500">Aucun email</p>
                      ) : (
                        Object.entries(groupedEmails).map(([date, interactions]) => (
                          <div key={date}>
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">{date}</h3>
                            <div className="space-y-2">
                              {interactions.map((interaction) => (
                                <div
                                  key={interaction.id}
                                  onClick={() => {
                                    setViewingActivity(interaction);
                                    setShowActivityModal(true);
                                  }}
                                  className="relative cursor-pointer rounded-lg border border-blue-200 bg-blue-50 p-2.5 transition-colors hover:shadow-md sm:p-3"
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="mt-0.5 shrink-0">
                                      {getInteractionIcon(interaction.type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="wrap-break-words text-sm font-medium text-gray-900">
                                        {getInteractionLabel(interaction.type)}
                                        {interaction.title && `: ${interaction.title}`}
                                      </p>
                                      {interaction.content && (
                                        <p className="wrap-break-words mt-1 line-clamp-2 text-xs text-gray-700">
                                          {interaction.content
                                            .replace(/<[^>]+>/g, '')
                                            .substring(0, 100)}
                                          {interaction.content.replace(/<[^>]+>/g, '').length >
                                            100 && '...'}
                                        </p>
                                      )}
                                      <div className="mt-1.5 flex items-center justify-between">
                                        <p className="text-xs text-gray-500">
                                          {new Date(interaction.createdAt).toLocaleTimeString(
                                            'fr-FR',
                                            {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            },
                                          )}
                                        </p>
                                        {interaction.user && (
                                          <p className="text-xs text-gray-500">
                                            Par : {interaction.user.name || interaction.user.email}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white p-6 shadow-xl sm:p-8">
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
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Assignation</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

      {/* Modal d'édition de Rendez-vous */}
      {showEditAppointmentModal && editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white p-6 shadow-xl sm:p-8">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Modifier le rendez-vous
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditAppointmentModal(false);
                    setEditingAppointment(null);
                    setEditAppointmentError('');
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
              id="edit-appointment-form"
              onSubmit={handleUpdateAppointment}
              className="flex-1 space-y-6 overflow-y-auto pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Titre *</label>
                <input
                  type="text"
                  required
                  value={editAppointmentData.title}
                  onChange={(e) =>
                    setEditAppointmentData({ ...editAppointmentData, title: e.target.value })
                  }
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ex : Rendez-vous avec le client"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date & heure *</label>
                <div className="mt-1 grid grid-cols-[3fr,2fr] gap-2">
                  <input
                    type="date"
                    required
                    value={
                      editAppointmentData.scheduledAt
                        ? editAppointmentData.scheduledAt.split('T')[0]
                        : new Date(editingAppointment.scheduledAt).toISOString().split('T')[0]
                    }
                    onChange={(e) => {
                      const time =
                        editAppointmentData.scheduledAt &&
                        editAppointmentData.scheduledAt.includes('T')
                          ? editAppointmentData.scheduledAt.split('T')[1]
                          : new Date(editingAppointment.scheduledAt)
                              .toISOString()
                              .split('T')[1]
                              .slice(0, 5);
                      setEditAppointmentData({
                        ...editAppointmentData,
                        scheduledAt: `${e.target.value}T${time || '09:00'}`,
                      });
                    }}
                    className="block w-full rounded-xl border border-gray-300 px-2 py-1.5 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <input
                    type="time"
                    required
                    value={
                      editAppointmentData.scheduledAt &&
                      editAppointmentData.scheduledAt.includes('T')
                        ? editAppointmentData.scheduledAt.split('T')[1].slice(0, 5)
                        : new Date(editingAppointment.scheduledAt)
                            .toISOString()
                            .split('T')[1]
                            .slice(0, 5)
                    }
                    onChange={(e) => {
                      const datePart =
                        editAppointmentData.scheduledAt &&
                        editAppointmentData.scheduledAt.includes('T')
                          ? editAppointmentData.scheduledAt.split('T')[0]
                          : new Date(editingAppointment.scheduledAt).toISOString().split('T')[0];
                      setEditAppointmentData({
                        ...editAppointmentData,
                        scheduledAt: `${datePart}T${e.target.value || '09:00'}`,
                      });
                    }}
                    className="block w-full rounded-xl border border-gray-300 px-2 py-1.5 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Priorité</label>
                <select
                  value={editAppointmentData.priority}
                  onChange={(e) =>
                    setEditAppointmentData({
                      ...editAppointmentData,
                      priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
                    })
                  }
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Rappel</label>
                <select
                  value={editAppointmentData.reminderMinutesBefore ?? ''}
                  onChange={(e) =>
                    setEditAppointmentData({
                      ...editAppointmentData,
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

              <div>
                <label className="block text-sm font-medium text-gray-700">Attribuer à</label>
                <select
                  value={editAppointmentData.assignedUserId}
                  onChange={(e) =>
                    setEditAppointmentData({
                      ...editAppointmentData,
                      assignedUserId: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Moi-même ({session?.user?.name || 'Utilisateur'})</option>
                  {isAdmin &&
                    users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <Editor
                  ref={editAppointmentEditorRef}
                  onReady={(methods) => {
                    // Injecter la description lorsque l'éditeur est prêt
                    if (editingAppointment?.description) {
                      methods.injectHTML(editingAppointment.description);
                    }
                  }}
                />
              </div>

              {editAppointmentError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {editAppointmentError}
                </div>
              )}
            </form>

            {/* Pied de modal fixe */}
            <div className="shrink-0 border-t border-gray-100 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditAppointmentModal(false);
                    setEditingAppointment(null);
                    setEditAppointmentError('');
                  }}
                  className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="edit-appointment-form"
                  disabled={editAppointmentLoading}
                  className="w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {editAppointmentLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'interaction */}
      {showInteractionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white p-6 shadow-xl sm:p-8">
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
                  <option value="MEETING">Rendez-vous</option>
                </select>
              </div>

              {interactionData.type === 'NOTE' && noteTemplates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Utiliser un template
                  </label>
                  <select
                    onChange={(e) => {
                      const templateId = e.target.value;
                      if (templateId && contact) {
                        const template = noteTemplates.find((t) => t.id === templateId);
                        if (template) {
                          // Remplacer les variables dans le contenu
                          const variables = {
                            firstName: contact.firstName,
                            lastName: contact.lastName,
                            civility: contact.civility,
                            email: contact.email,
                            phone: contact.phone,
                            secondaryPhone: contact.secondaryPhone,
                            address: contact.address,
                            city: contact.city,
                            postalCode: contact.postalCode,
                            companyName: contact.companyName
                              ? contact.companyName
                              : contact.companyRelation
                                ? `${contact.companyRelation.firstName || ''} ${contact.companyRelation.lastName || ''}`.trim()
                                : null,
                          };

                          const processedContent = replaceTemplateVariables(
                            template.content,
                            variables,
                          );

                          setInteractionData({
                            ...interactionData,
                            content: processedContent,
                          });
                          if (interactionEditorRef.current) {
                            interactionEditorRef.current.injectHTML(processedContent);
                          }
                        }
                      }
                    }}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Sélectionner un template...</option>
                    {noteTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
          <div className="flex max-h-[95vh] w-full max-w-5xl flex-col rounded-lg bg-white p-6 shadow-xl sm:p-8">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Envoyer un email</h2>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailData({ to: '', cc: '', bcc: '', subject: '', content: '' });
                    setEmailAttachments([]);
                    setShowCc(false);
                    setShowBcc(false);
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
              className="flex-1 space-y-4 overflow-y-auto px-1 pt-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">À *</label>
                <input
                  type="email"
                  required
                  value={emailData.to}
                  onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder={contact.email || 'email@exemple.com'}
                />
                <div className="mt-2 flex items-center gap-3">
                  {!showCc && (
                    <button
                      type="button"
                      onClick={() => setShowCc(true)}
                      className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      + Cc
                    </button>
                  )}
                  {!showBcc && (
                    <button
                      type="button"
                      onClick={() => setShowBcc(true)}
                      className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      + Cci
                    </button>
                  )}
                </div>
              </div>

              {showCc && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cc</label>
                  <input
                    type="text"
                    value={emailData.cc}
                    onChange={(e) => setEmailData({ ...emailData, cc: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="copie@exemple.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Séparez plusieurs adresses par des virgules
                  </p>
                </div>
              )}

              {showBcc && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cci</label>
                  <input
                    type="text"
                    value={emailData.bcc}
                    onChange={(e) => setEmailData({ ...emailData, bcc: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="copie@exemple.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Séparez plusieurs adresses par des virgules
                  </p>
                </div>
              )}

              {emailTemplates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Utiliser un template
                  </label>
                  <select
                    onChange={(e) => {
                      const templateId = e.target.value;
                      if (templateId && contact) {
                        const template = emailTemplates.find((t) => t.id === templateId);
                        if (template) {
                          // Remplacer les variables dans le sujet et le contenu
                          const variables = {
                            firstName: contact.firstName,
                            lastName: contact.lastName,
                            civility: contact.civility,
                            email: contact.email,
                            phone: contact.phone,
                            secondaryPhone: contact.secondaryPhone,
                            address: contact.address,
                            city: contact.city,
                            postalCode: contact.postalCode,
                            companyName: contact.companyName
                              ? contact.companyName
                              : contact.companyRelation
                                ? `${contact.companyRelation.firstName || ''} ${contact.companyRelation.lastName || ''}`.trim()
                                : null,
                          };

                          const processedSubject = replaceTemplateVariables(
                            template.subject || '',
                            variables,
                          );
                          const processedContent = replaceTemplateVariables(
                            template.content,
                            variables,
                          );

                          setEmailData({
                            ...emailData,
                            subject: processedSubject,
                            content: processedContent,
                          });
                          if (emailEditorRef.current) {
                            emailEditorRef.current.injectHTML(processedContent);
                          }
                        }
                      }
                    }}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Sélectionner un template...</option>
                    {emailTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              <div className="space-y-2 py-2">
                <label className="block text-sm font-medium text-gray-700">Pièces jointes</label>
                <div>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setEmailAttachments((prev) => [...prev, ...files]);
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
                {emailAttachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {emailAttachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailAttachments((prev) => prev.filter((_, i) => i !== index));
                          }}
                          className="cursor-pointer text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                    setEmailData({ to: '', cc: '', bcc: '', subject: '', content: '' });
                    setEmailAttachments([]);
                    setShowCc(false);
                    setShowBcc(false);
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
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white p-6 shadow-xl">
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
                      reminderMinutesBefore: null,
                      durationMinutes: 30,
                      attendees: [],
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
              className="flex-1 space-y-8 overflow-y-auto px-2 pt-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Titre de la tâche (optionnel)
                </label>
                <input
                  type="text"
                  value={taskData.title}
                  onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ex : Suivi client"
                />
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
                          scheduledAt: time
                            ? `${e.target.value}T${time}`
                            : `${e.target.value}T09:00`,
                        });
                      }}
                      className="block w-full rounded-xl border border-gray-300 px-2 py-1.5 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                      className="block w-full rounded-xl border border-gray-300 px-2 py-1.5 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  <option value="">Moi-même ({session?.user?.name || 'Utilisateur'})</option>
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
                      reminderMinutesBefore: null,
                      durationMinutes: 30,
                      attendees: [],
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

      {/* Modal de création de Rendez-vous */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white p-6 shadow-xl">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                    Créer un rendez-vous
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
                    setShowMeetingModal(false);
                    setMeetingData({
                      title: '',
                      description: '',
                      scheduledAt: '',
                      priority: 'MEDIUM',
                      assignedUserId: '',
                      reminderMinutesBefore: null,
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
              id="meeting-form"
              onSubmit={handleCreateMeeting}
              className="flex-1 space-y-6 overflow-y-auto px-2 pt-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Titre du rendez-vous (optionnel)
                </label>
                <input
                  type="text"
                  value={meetingData.title}
                  onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ex : Rendez-vous avec le client"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Date & heure *</p>
                  <div className="grid grid-cols-[3fr,2fr] gap-2">
                    <input
                      type="date"
                      required
                      value={meetingData.scheduledAt ? meetingData.scheduledAt.split('T')[0] : ''}
                      onChange={(e) => {
                        const time =
                          meetingData.scheduledAt && meetingData.scheduledAt.includes('T')
                            ? meetingData.scheduledAt.split('T')[1]
                            : '';
                        setMeetingData({
                          ...meetingData,
                          scheduledAt: time
                            ? `${e.target.value}T${time}`
                            : `${e.target.value}T09:00`,
                        });
                      }}
                      className="block w-full rounded-xl border border-gray-300 px-2 py-1.5 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <input
                      type="time"
                      value={
                        meetingData.scheduledAt && meetingData.scheduledAt.includes('T')
                          ? meetingData.scheduledAt.split('T')[1].slice(0, 5)
                          : ''
                      }
                      onChange={(e) => {
                        const datePart =
                          meetingData.scheduledAt && meetingData.scheduledAt.includes('T')
                            ? meetingData.scheduledAt.split('T')[0]
                            : new Date().toISOString().split('T')[0];
                        setMeetingData({
                          ...meetingData,
                          scheduledAt: `${datePart}T${e.target.value || '09:00'}`,
                        });
                      }}
                      className="block w-full rounded-xl border border-gray-300 px-2 py-1.5 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                      const isActive = meetingData.priority === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setMeetingData({
                              ...meetingData,
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

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Rappel</p>
                <select
                  value={meetingData.reminderMinutesBefore ?? ''}
                  onChange={(e) =>
                    setMeetingData({
                      ...meetingData,
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

              <div>
                <label className="block text-sm font-medium text-gray-700">Attribuer à</label>
                <select
                  value={meetingData.assignedUserId}
                  onChange={(e) =>
                    setMeetingData({ ...meetingData, assignedUserId: e.target.value })
                  }
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Moi-même ({session?.user?.name || 'Utilisateur'})</option>
                  {isAdmin &&
                    users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <Editor ref={meetingEditorRef} />
                <p className="text-xs text-gray-500">
                  Ajoutez des détails sur ce rendez-vous (contexte, points à aborder, informations
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
                    setShowMeetingModal(false);
                    setMeetingData({
                      title: '',
                      description: '',
                      scheduledAt: '',
                      priority: 'MEDIUM',
                      assignedUserId: '',
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
                  form="meeting-form"
                  disabled={creatingMeeting}
                  className="w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {creatingMeeting ? 'Création...' : 'Créer le rendez-vous'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création d'appel */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white p-6 shadow-xl">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Créer un appel</h2>
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
                    setShowCallModal(false);
                    setCallData({
                      title: 'Appel téléphonique',
                      description: '',
                      scheduledAt: '',
                      priority: 'MEDIUM',
                      assignedUserId: '',
                      reminderMinutesBefore: null,
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
              id="call-form"
              onSubmit={handleCreateCall}
              className="flex-1 space-y-6 overflow-y-auto px-2 pt-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Titre de l'appel (optionnel)
                </label>
                <input
                  type="text"
                  value={callData.title}
                  onChange={(e) => setCallData({ ...callData, title: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ex : Appeler le client pour devis"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Date & heure *</p>
                  <div className="grid grid-cols-[3fr,2fr] gap-2">
                    <input
                      type="date"
                      required
                      value={callData.scheduledAt ? callData.scheduledAt.split('T')[0] : ''}
                      onChange={(e) => {
                        const time =
                          callData.scheduledAt && callData.scheduledAt.includes('T')
                            ? callData.scheduledAt.split('T')[1]
                            : '';
                        setCallData({
                          ...callData,
                          scheduledAt: time
                            ? `${e.target.value}T${time}`
                            : `${e.target.value}T09:00`,
                        });
                      }}
                      className="block w-full rounded-xl border border-gray-300 px-2 py-1.5 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <input
                      type="time"
                      value={
                        callData.scheduledAt && callData.scheduledAt.includes('T')
                          ? callData.scheduledAt.split('T')[1].slice(0, 5)
                          : ''
                      }
                      onChange={(e) => {
                        const datePart =
                          callData.scheduledAt && callData.scheduledAt.includes('T')
                            ? callData.scheduledAt.split('T')[0]
                            : new Date().toISOString().split('T')[0];
                        setCallData({
                          ...callData,
                          scheduledAt: `${datePart}T${e.target.value || '09:00'}`,
                        });
                      }}
                      className="block w-full rounded-xl border border-gray-300 px-2 py-1.5 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                      const isActive = callData.priority === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setCallData({
                              ...callData,
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

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Rappel</p>
                <select
                  value={callData.reminderMinutesBefore ?? ''}
                  onChange={(e) =>
                    setCallData({
                      ...callData,
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

              <div>
                <label className="block text-sm font-medium text-gray-700">Attribuer à</label>
                <select
                  value={callData.assignedUserId}
                  onChange={(e) => setCallData({ ...callData, assignedUserId: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Moi-même ({session?.user?.name || 'Utilisateur'})</option>
                  {isAdmin &&
                    users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <Editor ref={callEditorRef} />
                <p className="text-xs text-gray-500">
                  Ajoutez des détails sur cet appel (contexte, points à aborder, informations
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
                    setShowCallModal(false);
                    setCallData({
                      title: 'Appel téléphonique',
                      description: '',
                      scheduledAt: '',
                      priority: 'MEDIUM',
                      assignedUserId: '',
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
                  form="call-form"
                  disabled={creatingCall}
                  className="w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {creatingCall ? 'Création...' : "Créer l'appel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création de note */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-6 backdrop-blur-sm sm:p-8">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white p-6 shadow-xl">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Créer une note</h2>
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
                    setShowNoteModal(false);
                    setNoteData({
                      title: '',
                      content: '',
                      date: '',
                    });
                    noteEditorRef.current?.injectHTML('');
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
              id="note-form"
              onSubmit={handleCreateNote}
              className="flex-1 space-y-6 overflow-y-auto px-2 pt-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {noteTemplates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Utiliser un template
                  </label>
                  <select
                    onChange={(e) => {
                      const templateId = e.target.value;
                      if (templateId && contact) {
                        const template = noteTemplates.find((t) => t.id === templateId);
                        if (template) {
                          const variables = {
                            firstName: contact.firstName,
                            lastName: contact.lastName,
                            civility: contact.civility,
                            email: contact.email,
                            phone: contact.phone,
                            secondaryPhone: contact.secondaryPhone,
                            address: contact.address,
                            city: contact.city,
                            postalCode: contact.postalCode,
                            companyName: contact.companyName
                              ? contact.companyName
                              : contact.companyRelation
                                ? `${contact.companyRelation.firstName || ''} ${contact.companyRelation.lastName || ''}`.trim()
                                : null,
                          };

                          const processedContent = replaceTemplateVariables(
                            template.content,
                            variables,
                          );

                          setNoteData({
                            ...noteData,
                            content: processedContent,
                          });
                          if (noteEditorRef.current) {
                            noteEditorRef.current.injectHTML(processedContent);
                          }
                        }
                      }
                    }}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Sélectionner un template...</option>
                    {noteTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Titre (optionnel)</label>
                <input
                  type="text"
                  value={noteData.title}
                  onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Titre de la note"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Contenu *</label>
                <Editor ref={noteEditorRef} />
                <p className="text-xs text-gray-500">
                  Ajoutez le contenu de votre note (informations importantes, observations…).
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
                    setShowNoteModal(false);
                    setNoteData({
                      title: '',
                      content: '',
                      date: '',
                    });
                    noteEditorRef.current?.injectHTML('');
                    setError('');
                  }}
                  className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="note-form"
                  className="w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:w-auto"
                >
                  Créer la note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Google Meet */}
      {showMeetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white p-6 shadow-xl sm:p-8">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Programmer une visio-conférence
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
                      internalNote: '',
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
              className="flex-1 space-y-4 overflow-y-auto px-1 pt-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  placeholder="Ex: Rendez-vous avec..."
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
                      className="block w-full rounded-xl border border-gray-300 px-2 py-1.5 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                      className="block w-full rounded-xl border border-gray-300 px-2 py-1.5 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  placeholder={`email1@example.com
email2@example.com`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Le contact sera automatiquement invité si son email est renseigné
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <Editor ref={meetEditorRef} />
                <p className="text-xs text-gray-500">
                  Ajoutez des détails sur cette réunion (ordre du jour, points à aborder…). Cette
                  description sera partagée avec les participants.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Note personnelle (optionnel)
                </label>
                <textarea
                  value={meetData.internalNote}
                  onChange={(e) => setMeetData({ ...meetData, internalNote: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ajoutez une note personnelle qui ne sera pas partagée dans l'email..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Cette note est uniquement visible dans le CRM et ne sera pas envoyée aux
                  participants.
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
                      internalNote: '',
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditMeetModal(false);
              setEditingMeetTask(null);
              setEditMeetError('');
              setEditMeetData({
                scheduledAt: '',
                durationMinutes: 30,
                attendees: [],
              });
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white p-6 shadow-xl sm:p-8">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Modifier le Google Meet
                </h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowEditMeetModal(false);
                    setEditingMeetTask(null);
                    setEditMeetError('');
                    setEditMeetData({
                      scheduledAt: '',
                      durationMinutes: 30,
                      attendees: [],
                    });
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
                        : (() => {
                            // Utiliser l'heure locale sans conversion UTC
                            const scheduledDate = new Date(editingMeetTask.scheduledAt);
                            const year = scheduledDate.getFullYear();
                            const month = String(scheduledDate.getMonth() + 1).padStart(2, '0');
                            const day = String(scheduledDate.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          })()
                    }
                    onChange={(e) => {
                      const time =
                        editMeetData.scheduledAt && editMeetData.scheduledAt.includes('T')
                          ? editMeetData.scheduledAt.split('T')[1]
                          : (() => {
                              // Utiliser l'heure locale sans conversion UTC
                              const scheduledDate = new Date(editingMeetTask.scheduledAt);
                              const hours = String(scheduledDate.getHours()).padStart(2, '0');
                              const minutes = String(scheduledDate.getMinutes()).padStart(2, '0');
                              return `${hours}:${minutes}`;
                            })();
                      setEditMeetData({
                        ...editMeetData,
                        scheduledAt: `${e.target.value}T${time || '09:00'}`,
                      });
                    }}
                    className="block w-full rounded-xl border border-gray-300 px-2 py-1.5 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <input
                    type="time"
                    required
                    value={
                      editMeetData.scheduledAt && editMeetData.scheduledAt.includes('T')
                        ? editMeetData.scheduledAt.split('T')[1].slice(0, 5)
                        : (() => {
                            // Utiliser l'heure locale sans conversion UTC
                            const scheduledDate = new Date(editingMeetTask.scheduledAt);
                            const hours = String(scheduledDate.getHours()).padStart(2, '0');
                            const minutes = String(scheduledDate.getMinutes()).padStart(2, '0');
                            return `${hours}:${minutes}`;
                          })()
                    }
                    onChange={(e) => {
                      const datePart =
                        editMeetData.scheduledAt && editMeetData.scheduledAt.includes('T')
                          ? editMeetData.scheduledAt.split('T')[0]
                          : (() => {
                              // Utiliser l'heure locale sans conversion UTC
                              const scheduledDate = new Date(editingMeetTask.scheduledAt);
                              const year = scheduledDate.getFullYear();
                              const month = String(scheduledDate.getMonth() + 1).padStart(2, '0');
                              const day = String(scheduledDate.getDate()).padStart(2, '0');
                              return `${year}-${month}-${day}`;
                            })();
                      setEditMeetData({
                        ...editMeetData,
                        scheduledAt: `${datePart}T${e.target.value || '09:00'}`,
                      });
                    }}
                    className="block w-full rounded-xl border border-gray-300 px-2 py-1.5 text-xs text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Durée (minutes)</label>
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Invités additionnels (optionnel)
                </label>
                <div className="space-y-2">
                  {editMeetData.attendees.map((email, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          const newAttendees = [...editMeetData.attendees];
                          newAttendees[index] = e.target.value;
                          setEditMeetData({ ...editMeetData, attendees: newAttendees });
                        }}
                        placeholder="email@exemple.com"
                        className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newAttendees = editMeetData.attendees.filter((_, i) => i !== index);
                          setEditMeetData({ ...editMeetData, attendees: newAttendees });
                        }}
                        className="cursor-pointer rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setEditMeetData({
                        ...editMeetData,
                        attendees: [...editMeetData.attendees, ''],
                      });
                    }}
                    className="cursor-pointer rounded-xl border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-indigo-500 hover:text-indigo-600"
                  >
                    + Ajouter un invité
                  </button>
                </div>
                {contact.email && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500">
                      Le contact ({contact.email}) sera automatiquement invité
                    </p>
                    {/* Afficher le contact dans la liste des invités s'il est présent dans Google Calendar */}
                    {editMeetData.attendees.some((email) => email === contact.email) && (
                      <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-2">
                        <span className="text-xs text-blue-700">{contact.email}</span>
                      </div>
                    )}
                  </div>
                )}
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
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{editMeetError}</div>
              )}
            </form>

            {/* Pied de modal fixe */}
            <div className="shrink-0 border-t border-gray-100 pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleDeleteMeet}
                  disabled={deleteMeetLoading || editMeetLoading}
                  className="w-full cursor-pointer rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {deleteMeetLoading ? (
                    'Suppression...'
                  ) : (
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </span>
                  )}
                </button>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowEditMeetModal(false);
                      setEditingMeetTask(null);
                      setEditMeetError('');
                      setEditMeetData({
                        scheduledAt: '',
                        durationMinutes: 30,
                        attendees: [],
                      });
                    }}
                    disabled={deleteMeetLoading || editMeetLoading}
                    className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    form="edit-meet-form"
                    disabled={editMeetLoading || deleteMeetLoading}
                    className="w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {editMeetLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualisation d'activité */}
      {showActivityModal && viewingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white p-6 shadow-xl">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gray-100 p-2">
                    {getInteractionIcon(viewingActivity.type)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                      {getInteractionLabel(viewingActivity.type)}
                      {viewingActivity.title && `: ${viewingActivity.title}`}
                    </h2>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        {new Date(viewingActivity.createdAt).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}{' '}
                        à{' '}
                        {new Date(viewingActivity.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {viewingActivity.user && (
                        <span>Par : {viewingActivity.user.name || viewingActivity.user.email}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowActivityModal(false);
                    setViewingActivity(null);
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
            <div className="flex-1 overflow-y-auto px-2 pt-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {/* Destinataires pour les emails */}
              {viewingActivity.type === 'EMAIL' &&
                viewingActivity.metadata &&
                ((viewingActivity.metadata as any).to ||
                  (viewingActivity.metadata as any).cc ||
                  (viewingActivity.metadata as any).bcc) && (
                  <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    {(viewingActivity.metadata as any).to && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-600">À :</p>
                        <p className="text-sm text-gray-700">
                          {Array.isArray((viewingActivity.metadata as any).to)
                            ? (viewingActivity.metadata as any).to.join(', ')
                            : (viewingActivity.metadata as any).to}
                        </p>
                      </div>
                    )}
                    {(viewingActivity.metadata as any).cc &&
                      Array.isArray((viewingActivity.metadata as any).cc) &&
                      (viewingActivity.metadata as any).cc.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-600">CC :</p>
                          <p className="text-sm text-gray-700">
                            {(viewingActivity.metadata as any).cc.join(', ')}
                          </p>
                        </div>
                      )}
                    {(viewingActivity.metadata as any).bcc &&
                      Array.isArray((viewingActivity.metadata as any).bcc) &&
                      (viewingActivity.metadata as any).bcc.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-600">CCI :</p>
                          <p className="text-sm text-gray-700">
                            {(viewingActivity.metadata as any).bcc.join(', ')}
                          </p>
                        </div>
                      )}
                  </div>
                )}

              {/* Pièces jointes pour les emails */}
              {viewingActivity.type === 'EMAIL' &&
                viewingActivity.metadata &&
                (viewingActivity.metadata as any).attachments &&
                Array.isArray((viewingActivity.metadata as any).attachments) &&
                (viewingActivity.metadata as any).attachments.length > 0 && (
                  <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="mb-2 text-sm font-medium text-gray-700">Pièces jointes :</p>
                    <div className="space-y-1">
                      {(viewingActivity.metadata as any).attachments.map(
                        (filename: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded bg-white px-2 py-1.5 text-sm text-gray-700"
                          >
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span>{filename}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Contenu */}
              {(() => {
                // Pour les emails, utiliser le HTML depuis les métadonnées si disponible
                let contentToDisplay = viewingActivity.content;
                let shouldRenderHTML = false;

                // Pour les emails, utiliser le HTML depuis les métadonnées si disponible
                if (
                  viewingActivity.type === 'EMAIL' &&
                  viewingActivity.metadata &&
                  (viewingActivity.metadata as any).htmlContent
                ) {
                  contentToDisplay = (viewingActivity.metadata as any).htmlContent;
                  shouldRenderHTML = true;
                }
                // Pour les notes, utiliser le HTML depuis les métadonnées si disponible
                else if (
                  viewingActivity.type === 'NOTE' &&
                  viewingActivity.metadata &&
                  (viewingActivity.metadata as any).htmlContent
                ) {
                  contentToDisplay = (viewingActivity.metadata as any).htmlContent;
                  shouldRenderHTML = true;
                }
                // Pour APPOINTMENT_CREATED, récupérer la description de la tâche
                else if (
                  viewingActivity.type === 'APPOINTMENT_CREATED' &&
                  viewingActivity.metadata &&
                  (viewingActivity.metadata as any).taskId
                ) {
                  // On va chercher la tâche dans la liste des tâches
                  const task = tasks.find((t) => t.id === (viewingActivity.metadata as any).taskId);
                  if (task && task.description) {
                    contentToDisplay = task.description;
                    shouldRenderHTML = true;
                  }
                }
                // Pour les autres types qui peuvent contenir du HTML (NOTE par défaut)
                else if (viewingActivity.type === 'NOTE') {
                  // Si le contenu semble être du HTML, l'afficher comme HTML
                  if (viewingActivity.content && viewingActivity.content.includes('<')) {
                    contentToDisplay = viewingActivity.content;
                    shouldRenderHTML = true;
                  }
                }

                if (contentToDisplay) {
                  return (
                    <div className="prose prose-sm max-w-none">
                      {shouldRenderHTML ? (
                        <div
                          className="text-sm text-gray-700"
                          dangerouslySetInnerHTML={{ __html: contentToDisplay }}
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap text-gray-700">
                          {contentToDisplay.replace(/<[^>]+>/g, '')}
                        </p>
                      )}
                    </div>
                  );
                }
                return <p className="text-sm text-gray-500">Aucun contenu disponible</p>;
              })()}
            </div>

            {/* Pied de modal fixe */}
            <div className="shrink-0 border-t border-gray-100 pt-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowActivityModal(false);
                    setViewingActivity(null);
                  }}
                  className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualisation de rendez-vous */}
      {showViewAppointmentModal && viewingAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowViewAppointmentModal(false);
              setViewingAppointment(null);
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-gray-100 px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {viewingAppointment.type === 'VIDEO_CONFERENCE' ? (
                      <Video className="h-6 w-6 text-indigo-600" />
                    ) : (
                      <CalendarIcon className="h-6 w-6 text-yellow-600" />
                    )}
                    <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                      {viewingAppointment.title || 'Rendez-vous'}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        viewingAppointment.type === 'VIDEO_CONFERENCE'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {viewingAppointment.type === 'VIDEO_CONFERENCE'
                        ? 'Google Meet'
                        : 'Rendez-vous physique'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      {new Date(viewingAppointment.scheduledAt).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}{' '}
                      à{' '}
                      {new Date(viewingAppointment.scheduledAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {viewingAppointment.type === 'VIDEO_CONFERENCE' &&
                      viewingAppointment.durationMinutes && (
                        <span>Durée : {viewingAppointment.durationMinutes} minutes</span>
                      )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowViewAppointmentModal(false);
                    setViewingAppointment(null);
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
            <div className="flex-1 overflow-y-auto px-6 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {/* Invités pour Google Meet */}
              {viewingAppointment.type === 'VIDEO_CONFERENCE' && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="mb-2 text-sm font-medium text-gray-700">Invités :</p>
                  <div className="space-y-1">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MailIcon className="h-4 w-4 text-gray-500" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lien Google Meet */}
              {viewingAppointment.type === 'VIDEO_CONFERENCE' &&
                viewingAppointment.googleMeetLink && (
                  <div className="mb-4">
                    <a
                      href={viewingAppointment.googleMeetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Rejoindre la réunion
                    </a>
                  </div>
                )}

              {/* Description */}
              {viewingAppointment.description && (
                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">Description :</p>
                  <div
                    className="prose prose-sm max-w-none text-sm text-gray-700"
                    dangerouslySetInnerHTML={{ __html: viewingAppointment.description }}
                  />
                </div>
              )}

              {/* Note personnelle */}
              {viewingAppointment.internalNote && (
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="mb-1 text-xs font-medium text-blue-900">📝 Note personnelle</p>
                  <p className="text-xs whitespace-pre-wrap text-blue-800">
                    {viewingAppointment.internalNote}
                  </p>
                </div>
              )}

              {/* Informations supplémentaires pour rendez-vous physique */}
              {viewingAppointment.type === 'MEETING' && (
                <div className="space-y-2">
                  {viewingAppointment.priority && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Priorité :</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          viewingAppointment.priority === 'URGENT'
                            ? 'bg-red-100 text-red-700'
                            : viewingAppointment.priority === 'HIGH'
                              ? 'bg-orange-100 text-orange-700'
                              : viewingAppointment.priority === 'MEDIUM'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {viewingAppointment.priority === 'URGENT'
                          ? 'Urgente'
                          : viewingAppointment.priority === 'HIGH'
                            ? 'Haute'
                            : viewingAppointment.priority === 'MEDIUM'
                              ? 'Moyenne'
                              : 'Basse'}
                      </span>
                    </div>
                  )}
                  {viewingAppointment.reminderMinutesBefore && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Rappel :</span>
                      <span className="text-sm text-gray-600">
                        {viewingAppointment.reminderMinutesBefore} minutes avant
                      </span>
                    </div>
                  )}
                  {viewingAppointment.assignedUser && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">Assigné à :</span>
                      <span className="text-sm text-gray-600">
                        {viewingAppointment.assignedUser.name || viewingAppointment.assignedUser.email}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pied de modal fixe avec boutons */}
            <div className="shrink-0 border-t border-gray-100 px-6 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowViewAppointmentModal(false);
                    setViewingAppointment(null);
                  }}
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowViewAppointmentModal(false);
                    // Ouvrir le modal d'édition approprié
                    if (viewingAppointment.type === 'VIDEO_CONFERENCE') {
                      setEditingMeetTask(viewingAppointment);
                      const scheduledDate = new Date(viewingAppointment.scheduledAt);
                      const year = scheduledDate.getFullYear();
                      const month = String(scheduledDate.getMonth() + 1).padStart(2, '0');
                      const day = String(scheduledDate.getDate()).padStart(2, '0');
                      const hours = String(scheduledDate.getHours()).padStart(2, '0');
                      const minutes = String(scheduledDate.getMinutes()).padStart(2, '0');
                      const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

                      const fetchAttendees = async () => {
                        let attendeesList: string[] = [];
                        if (viewingAppointment.googleEventId) {
                          try {
                            const response = await fetch(
                              `/api/tasks/${viewingAppointment.id}/attendees`,
                            );
                            if (response.ok) {
                              const data = await response.json();
                              attendeesList = data.attendees || [];
                            }
                          } catch (error) {
                            console.error('Erreur lors de la récupération des invités:', error);
                          }
                        }

                        setEditMeetData({
                          scheduledAt: localDateTime,
                          durationMinutes: viewingAppointment.durationMinutes || 30,
                          attendees: attendeesList,
                        });
                        setShowEditMeetModal(true);
                      };

                      fetchAttendees();
                    } else {
                      setEditingAppointment(viewingAppointment);
                      setEditAppointmentData({
                        title: viewingAppointment.title || '',
                        description: viewingAppointment.description || '',
                        scheduledAt: viewingAppointment.scheduledAt
                          ? new Date(viewingAppointment.scheduledAt).toISOString().slice(0, 16)
                          : '',
                        priority: viewingAppointment.priority || 'MEDIUM',
                        assignedUserId: viewingAppointment.assignedUserId || '',
                        reminderMinutesBefore: viewingAppointment.reminderMinutesBefore || null,
                      });
                      setShowEditAppointmentModal(true);
                      setTimeout(() => {
                        if (
                          editAppointmentEditorRef.current &&
                          viewingAppointment.description
                        ) {
                          editAppointmentEditorRef.current.injectHTML(
                            viewingAppointment.description,
                          );
                        }
                      }, 200);
                    }
                    setViewingAppointment(null);
                  }}
                  className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (viewingAppointment.type === 'VIDEO_CONFERENCE') {
                      // Pour Google Meet, utiliser handleDeleteMeet
                      setEditingMeetTask(viewingAppointment);
                      setShowViewAppointmentModal(false);
                      setViewingAppointment(null);
                      await handleDeleteMeet();
                    } else {
                      // Pour rendez-vous physique, utiliser handleDeleteAppointment
                      await handleDeleteAppointment();
                    }
                  }}
                  disabled={deleteAppointmentLoading || deleteMeetLoading}
                  className="cursor-pointer rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleteAppointmentLoading || deleteMeetLoading ? (
                    'Annulation...'
                  ) : (
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Annuler
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
