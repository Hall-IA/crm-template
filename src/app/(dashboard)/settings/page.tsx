'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { useUserRole } from '@/hooks/use-user-role';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Editor, type DefaultTemplateRef } from '@/components/editor';
import { Eye, EyeOff } from 'lucide-react';

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
    signature: '',
  });
  const [smtpLoading, setSmtpLoading] = useState(true);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpError, setSmtpError] = useState('');
  const [smtpSuccess, setSmtpSuccess] = useState('');
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const smtpSignatureEditorRef = useRef<DefaultTemplateRef | null>(null);

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

  // État pour Google Calendar
  const [googleAccount, setGoogleAccount] = useState<{
    email: string | null;
    connected: boolean;
  } | null>(null);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleDisconnecting, setGoogleDisconnecting] = useState(false);

  // État pour l'intégration Meta Lead Ads (admin uniquement)
  const [metaLeadLoading, setMetaLeadLoading] = useState(true);
  const [metaLeadSaving, setMetaLeadSaving] = useState(false);
  const [metaLeadError, setMetaLeadError] = useState('');
  const [metaLeadSuccess, setMetaLeadSuccess] = useState('');
  const [metaLeadUsers, setMetaLeadUsers] = useState<{ id: string; name: string; email: string }[]>(
    [],
  );
  const [metaLeadConfigs, setMetaLeadConfigs] = useState<
    Array<{
      id: string;
      name: string;
      active: boolean;
      pageId: string;
      verifyToken: string;
      defaultStatusId: string | null;
      defaultAssignedUserId: string | null;
    }>
  >([]);
  const [showMetaLeadModal, setShowMetaLeadModal] = useState(false);
  const [editingMetaLeadConfig, setEditingMetaLeadConfig] = useState<string | null>(null);
  const [metaLeadFormData, setMetaLeadFormData] = useState<{
    name: string;
    active: boolean;
    pageId: string;
    accessToken: string;
    verifyToken: string;
    defaultStatusId: string | null;
    defaultAssignedUserId: string | null;
  }>({
    name: '',
    active: true,
    pageId: '',
    accessToken: '',
    verifyToken: '',
    defaultStatusId: null,
    defaultAssignedUserId: null,
  });

  // État pour l'intégration Google Ads Lead Forms (admin uniquement)
  const [googleAdsLoading, setGoogleAdsLoading] = useState(true);
  const [googleAdsSaving, setGoogleAdsSaving] = useState(false);
  const [googleAdsError, setGoogleAdsError] = useState('');
  const [googleAdsSuccess, setGoogleAdsSuccess] = useState('');
  const [googleAdsConfigs, setGoogleAdsConfigs] = useState<
    Array<{
      id: string;
      name: string;
      active: boolean;
      webhookKey: string;
      defaultStatusId: string | null;
      defaultAssignedUserId: string | null;
    }>
  >([]);
  const [showGoogleAdsModal, setShowGoogleAdsModal] = useState(false);
  const [editingGoogleAdsConfig, setEditingGoogleAdsConfig] = useState<string | null>(null);
  const [googleAdsFormData, setGoogleAdsFormData] = useState<{
    name: string;
    active: boolean;
    webhookKey: string;
    defaultStatusId: string | null;
    defaultAssignedUserId: string | null;
  }>({
    name: '',
    active: true,
    webhookKey: '',
    defaultStatusId: null,
    defaultAssignedUserId: null,
  });

  // État pour l'intégration Google Sheets (admin uniquement)
  const [googleSheetLoading, setGoogleSheetLoading] = useState(true);
  const [googleSheetSaving, setGoogleSheetSaving] = useState(false);
  const [googleSheetSyncing, setGoogleSheetSyncing] = useState(false);
  const [googleSheetError, setGoogleSheetError] = useState('');
  const [googleSheetSuccess, setGoogleSheetSuccess] = useState('');
  const [googleSheetConfigs, setGoogleSheetConfigs] = useState<
    Array<{
      id: string;
      name: string;
      active: boolean;
      spreadsheetId: string;
      sheetName: string;
      headerRow: number;
      phoneColumn: string;
      firstNameColumn: string | null;
      lastNameColumn: string | null;
      emailColumn: string | null;
      cityColumn: string | null;
      postalCodeColumn: string | null;
      originColumn: string | null;
      defaultStatusId: string | null;
      defaultAssignedUserId: string | null;
    }>
  >([]);
  const [showGoogleSheetModal, setShowGoogleSheetModal] = useState(false);
  const [editingGoogleSheetConfig, setEditingGoogleSheetConfig] = useState<string | null>(null);
  const [googleSheetFormData, setGoogleSheetFormData] = useState<{
    name: string;
    active: boolean;
    sheetUrl: string;
    sheetName: string;
    headerRow: string;
    phoneColumn: string;
    firstNameColumn: string;
    lastNameColumn: string;
    emailColumn: string;
    cityColumn: string;
    postalCodeColumn: string;
    originColumn: string;
    defaultStatusId: string | null;
    defaultAssignedUserId: string | null;
  }>({
    name: '',
    active: true,
    sheetUrl: '',
    sheetName: '',
    headerRow: '1',
    phoneColumn: '',
    firstNameColumn: '',
    lastNameColumn: '',
    emailColumn: '',
    cityColumn: '',
    postalCodeColumn: '',
    originColumn: '',
    defaultStatusId: null,
    defaultAssignedUserId: null,
  });

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
              signature: data.signature || '',
            });
            setSmtpConfigured(true);
            // Injecter la signature existante dans l'éditeur si disponible
            if (smtpSignatureEditorRef.current && data.signature) {
              smtpSignatureEditorRef.current.injectHTML(data.signature);
            }
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

  // Synchroniser l'éditeur de signature quand la signature change dans le state
  useEffect(() => {
    if (smtpSignatureEditorRef.current && smtpData.signature) {
      smtpSignatureEditorRef.current.injectHTML(smtpData.signature);
    }
  }, [smtpData.signature]);

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

  // Charger le statut de connexion Google
  useEffect(() => {
    const fetchGoogleAccount = async () => {
      try {
        setGoogleLoading(true);
        const response = await fetch('/api/auth/google/status');
        if (response.ok) {
          const data = await response.json();
          setGoogleAccount(data);
        } else {
          setGoogleAccount({ email: null, connected: false });
        }
      } catch (error) {
        console.error('Erreur lors du chargement du compte Google:', error);
        setGoogleAccount({ email: null, connected: false });
      } finally {
        setGoogleLoading(false);
      }
    };
    fetchGoogleAccount();
  }, []);

  // Charger la configuration Meta Lead Ads et la liste des utilisateurs (admin uniquement)
  useEffect(() => {
    if (!isAdmin) return;

    const fetchLeadConfigs = async () => {
      try {
        setMetaLeadLoading(true);
        setGoogleAdsLoading(true);
        setGoogleSheetLoading(true);
        setMetaLeadError('');
        setGoogleAdsError('');
        setGoogleSheetError('');

        const [metaConfigRes, googleAdsConfigRes, googleSheetConfigRes, usersRes] =
          await Promise.all([
            fetch('/api/settings/meta-leads'),
            fetch('/api/settings/google-ads'),
            fetch('/api/settings/google-sheet'),
            fetch('/api/users/list'),
          ]);

        if (metaConfigRes.ok) {
          const configsData = await metaConfigRes.json();
          setMetaLeadConfigs(Array.isArray(configsData) ? configsData : []);
        }

        if (googleAdsConfigRes.ok) {
          const configsData = await googleAdsConfigRes.json();
          setGoogleAdsConfigs(Array.isArray(configsData) ? configsData : []);
        }

        if (googleSheetConfigRes.ok) {
          const configsData = await googleSheetConfigRes.json();
          setGoogleSheetConfigs(Array.isArray(configsData) ? configsData : []);
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setMetaLeadUsers(usersData);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'intégration Meta Lead Ads:", error);
        setMetaLeadError("Erreur lors du chargement de l'intégration Meta Lead Ads");
      } finally {
        setMetaLeadLoading(false);
        setGoogleAdsLoading(false);
        setGoogleSheetLoading(false);
      }
    };

    fetchLeadConfigs();
  }, [isAdmin]);

  // Gérer les messages de succès/erreur depuis l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success === 'google_connected') {
      setGoogleAccount({ email: null, connected: true });
      // Recharger le statut
      fetch('/api/auth/google/status')
        .then((res) => res.json())
        .then((data) => setGoogleAccount(data))
        .catch(() => {});
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/settings');
    }

    if (error) {
      console.error('Erreur Google:', error);
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const handleGoogleConnect = () => {
    window.location.href = '/api/auth/google';
  };

  const handleGoogleDisconnect = async () => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter votre compte Google ?')) {
      return;
    }

    try {
      setGoogleDisconnecting(true);
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setGoogleAccount({ email: null, connected: false });
      } else {
        const data = await response.json();
        console.error('Erreur lors de la déconnexion:', data.error);
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion Google:', error);
    } finally {
      setGoogleDisconnecting(false);
    }
  };

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
      // Récupérer la signature actuelle depuis l'éditeur (HTML)
      let signatureHtml = smtpData.signature;
      if (smtpSignatureEditorRef.current) {
        try {
          signatureHtml = await smtpSignatureEditorRef.current.getHTML();
        } catch {
          // on ignore l'erreur, on garde la valeur du state
        }
      }

      const payload = { ...smtpData, signature: signatureHtml };

      const response = await fetch('/api/settings/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSmtpTestResult({
          success: true,
          message: data.message || 'Connexion SMTP réussie !',
        });
        setSmtpConfigured(true);

        // Si le test est concluant, on enregistre automatiquement la configuration
        try {
          setSmtpSaving(true);
          const saveResponse = await fetch('/api/settings/smtp', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          const saveData = await saveResponse.json();

          if (!saveResponse.ok) {
            throw new Error(saveData.error || 'Erreur lors de la sauvegarde de la configuration');
          }

          setSmtpSuccess('✅ Configuration SMTP testée et sauvegardée avec succès !');
        } catch (saveErr: any) {
          // On affiche l’erreur de sauvegarde mais on garde le succès du test
          setSmtpError(saveErr.message || 'La connexion fonctionne mais la sauvegarde a échoué.');
        } finally {
          setSmtpSaving(false);
        }
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
      // Récupérer la signature actuelle depuis l'éditeur (HTML)
      let signatureHtml = smtpData.signature;
      if (smtpSignatureEditorRef.current) {
        try {
          signatureHtml = await smtpSignatureEditorRef.current.getHTML();
        } catch {
          // on ignore l'erreur, on garde la valeur du state
        }
      }

      const payload = { ...smtpData, signature: signatureHtml };

      const response = await fetch('/api/settings/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const handleMetaLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMetaLeadError('');
    setMetaLeadSuccess('');
    setMetaLeadSaving(true);

    try {
      const url = editingMetaLeadConfig
        ? `/api/settings/meta-leads/${editingMetaLeadConfig}`
        : '/api/settings/meta-leads';
      const method = editingMetaLeadConfig ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaLeadFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde de la configuration Meta');
      }

      setMetaLeadSuccess(
        editingMetaLeadConfig
          ? '✅ Configuration Meta Lead Ads mise à jour avec succès !'
          : '✅ Configuration Meta Lead Ads créée avec succès !',
      );
      setShowMetaLeadModal(false);
      setEditingMetaLeadConfig(null);
      setMetaLeadFormData({
        name: '',
        active: true,
        pageId: '',
        accessToken: '',
        verifyToken: '',
        defaultStatusId: null,
        defaultAssignedUserId: null,
      });

      // Recharger les configurations
      const configsRes = await fetch('/api/settings/meta-leads');
      if (configsRes.ok) {
        const configsData = await configsRes.json();
        setMetaLeadConfigs(Array.isArray(configsData) ? configsData : []);
      }

      setTimeout(() => setMetaLeadSuccess(''), 5000);
    } catch (error: any) {
      setMetaLeadError(error.message || 'Erreur lors de la sauvegarde de la configuration Meta');
    } finally {
      setMetaLeadSaving(false);
    }
  };

  const handleGoogleAdsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleAdsError('');
    setGoogleAdsSuccess('');
    setGoogleAdsSaving(true);

    try {
      const url = editingGoogleAdsConfig
        ? `/api/settings/google-ads/${editingGoogleAdsConfig}`
        : '/api/settings/google-ads';
      const method = editingGoogleAdsConfig ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleAdsFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Erreur lors de la sauvegarde de la configuration Google Ads',
        );
      }

      setGoogleAdsSuccess(
        editingGoogleAdsConfig
          ? '✅ Configuration Google Ads mise à jour avec succès !'
          : '✅ Configuration Google Ads créée avec succès !',
      );
      setShowGoogleAdsModal(false);
      setEditingGoogleAdsConfig(null);
      setGoogleAdsFormData({
        name: '',
        active: true,
        webhookKey: '',
        defaultStatusId: null,
        defaultAssignedUserId: null,
      });

      // Recharger les configurations
      const configsRes = await fetch('/api/settings/google-ads');
      if (configsRes.ok) {
        const configsData = await configsRes.json();
        setGoogleAdsConfigs(Array.isArray(configsData) ? configsData : []);
      }

      setTimeout(() => setGoogleAdsSuccess(''), 5000);
    } catch (error: any) {
      setGoogleAdsError(error.message || 'Erreur lors de la sauvegarde de la configuration Google');
    } finally {
      setGoogleAdsSaving(false);
    }
  };

  const handleGoogleSheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleSheetError('');
    setGoogleSheetSuccess('');
    setGoogleSheetSaving(true);

    try {
      const url = editingGoogleSheetConfig
        ? `/api/settings/google-sheet/${editingGoogleSheetConfig}`
        : '/api/settings/google-sheet';
      const method = editingGoogleSheetConfig ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleSheetFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Erreur lors de la sauvegarde de la configuration Google Sheets',
        );
      }

      setGoogleSheetSuccess(
        editingGoogleSheetConfig
          ? '✅ Configuration Google Sheets mise à jour avec succès !'
          : '✅ Configuration Google Sheets créée avec succès !',
      );
      setShowGoogleSheetModal(false);
      setEditingGoogleSheetConfig(null);
      setGoogleSheetFormData({
        name: '',
        active: true,
        sheetUrl: '',
        sheetName: '',
        headerRow: '1',
        phoneColumn: '',
        firstNameColumn: '',
        lastNameColumn: '',
        emailColumn: '',
        cityColumn: '',
        postalCodeColumn: '',
        originColumn: '',
        defaultStatusId: null,
        defaultAssignedUserId: null,
      });

      // Recharger les configurations
      const configsRes = await fetch('/api/settings/google-sheet');
      if (configsRes.ok) {
        const configsData = await configsRes.json();
        setGoogleSheetConfigs(Array.isArray(configsData) ? configsData : []);
      }

      setTimeout(() => setGoogleSheetSuccess(''), 5000);
    } catch (error: any) {
      setGoogleSheetError(
        error.message || 'Erreur lors de la sauvegarde de la configuration Google Sheets',
      );
    } finally {
      setGoogleSheetSaving(false);
    }
  };

  const handleGoogleSheetSync = async () => {
    setGoogleSheetError('');
    setGoogleSheetSuccess('');
    setGoogleSheetSyncing(true);

    try {
      const response = await fetch('/api/integrations/google-sheet/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la synchronisation Google Sheets');
      }

      const totalImported = data.totalImported || data.imported || 0;
      const totalUpdated = data.totalUpdated || data.updated || 0;
      const totalSkipped = data.totalSkipped || data.skipped || 0;
      setGoogleSheetSuccess(
        `✅ Synchronisation terminée : ${totalImported} nouveau(x) contact(s), ${totalUpdated} mis à jour, ${totalSkipped} ignoré(s).`,
      );
      setTimeout(() => setGoogleSheetSuccess(''), 8000);
    } catch (error: any) {
      setGoogleSheetError(
        error.message || 'Erreur lors de la synchronisation des contacts Google Sheets',
      );
    } finally {
      setGoogleSheetSyncing(false);
    }
  };

  // Fonctions pour gérer les configurations Meta Lead Ads
  const handleEditMetaLead = (config: (typeof metaLeadConfigs)[0]) => {
    setEditingMetaLeadConfig(config.id);
    setMetaLeadFormData({
      name: config.name,
      active: config.active,
      pageId: config.pageId,
      accessToken: '', // Ne pas charger le token
      verifyToken: config.verifyToken,
      defaultStatusId: config.defaultStatusId,
      defaultAssignedUserId: config.defaultAssignedUserId,
    });
    setShowMetaLeadModal(true);
    setMetaLeadError('');
    setMetaLeadSuccess('');
  };

  const handleDeleteMetaLead = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/meta-leads/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      setMetaLeadSuccess('✅ Configuration supprimée avec succès !');
      setTimeout(() => setMetaLeadSuccess(''), 5000);

      // Recharger les configurations
      const configsRes = await fetch('/api/settings/meta-leads');
      if (configsRes.ok) {
        const configsData = await configsRes.json();
        setMetaLeadConfigs(Array.isArray(configsData) ? configsData : []);
      }
    } catch (error: any) {
      setMetaLeadError(error.message || 'Erreur lors de la suppression');
    }
  };

  // Fonctions pour gérer les configurations Google Ads
  const handleEditGoogleAds = (config: (typeof googleAdsConfigs)[0]) => {
    setEditingGoogleAdsConfig(config.id);
    setGoogleAdsFormData({
      name: config.name,
      active: config.active,
      webhookKey: config.webhookKey,
      defaultStatusId: config.defaultStatusId,
      defaultAssignedUserId: config.defaultAssignedUserId,
    });
    setShowGoogleAdsModal(true);
    setGoogleAdsError('');
    setGoogleAdsSuccess('');
  };

  const handleDeleteGoogleAds = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/google-ads/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      setGoogleAdsSuccess('✅ Configuration supprimée avec succès !');
      setTimeout(() => setGoogleAdsSuccess(''), 5000);

      // Recharger les configurations
      const configsRes = await fetch('/api/settings/google-ads');
      if (configsRes.ok) {
        const configsData = await configsRes.json();
        setGoogleAdsConfigs(Array.isArray(configsData) ? configsData : []);
      }
    } catch (error: any) {
      setGoogleAdsError(error.message || 'Erreur lors de la suppression');
    }
  };

  // Fonctions pour gérer les configurations Google Sheets
  const handleEditGoogleSheet = (config: (typeof googleSheetConfigs)[0]) => {
    setEditingGoogleSheetConfig(config.id);
    setGoogleSheetFormData({
      name: config.name,
      active: config.active,
      sheetUrl: config.spreadsheetId
        ? `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`
        : '',
      sheetName: config.sheetName,
      headerRow: config.headerRow.toString(),
      phoneColumn: config.phoneColumn,
      firstNameColumn: config.firstNameColumn || '',
      lastNameColumn: config.lastNameColumn || '',
      emailColumn: config.emailColumn || '',
      cityColumn: config.cityColumn || '',
      postalCodeColumn: config.postalCodeColumn || '',
      originColumn: config.originColumn || '',
      defaultStatusId: config.defaultStatusId,
      defaultAssignedUserId: config.defaultAssignedUserId,
    });
    setShowGoogleSheetModal(true);
    setGoogleSheetError('');
    setGoogleSheetSuccess('');
  };

  const handleDeleteGoogleSheet = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/google-sheet/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      setGoogleSheetSuccess('✅ Configuration supprimée avec succès !');
      setTimeout(() => setGoogleSheetSuccess(''), 5000);

      // Recharger les configurations
      const configsRes = await fetch('/api/settings/google-sheet');
      if (configsRes.ok) {
        const configsData = await configsRes.json();
        setGoogleSheetConfigs(Array.isArray(configsData) ? configsData : []);
      }
    } catch (error: any) {
      setGoogleSheetError(error.message || 'Erreur lors de la suppression');
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
                className={cn(
                  'mt-4 rounded-lg p-4',
                  smtpTestResult.success
                    ? 'border border-green-200 bg-green-50'
                    : 'border border-red-200 bg-red-50',
                )}
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
                    className={cn(
                      'text-sm font-medium',
                      smtpTestResult.success ? 'text-green-800' : 'text-red-800',
                    )}
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
                    <div className="relative mt-1">
                      <input
                        type={showSmtpPassword ? 'text' : 'password'}
                        required
                        value={smtpData.password}
                        onChange={(e) => setSmtpData({ ...smtpData, password: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400 hover:text-gray-600"
                        aria-label={
                          showSmtpPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                        }
                      >
                        {showSmtpPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
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

                <div className="mt-4 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-900">
                  <p className="font-medium">Utiliser Gmail avec SMTP</p>
                  <p className="mt-1">
                    Si vous utilisez une adresse Gmail, vous devez créer un{' '}
                    <span className="font-semibold">mot de passe d&apos;application</span> dédié et
                    le renseigner dans le champ &quot;Mot de passe&quot; ci-dessus. Rendez-vous sur{' '}
                    <Link
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold underline"
                    >
                      la page des mots de passe d&apos;application Google
                    </Link>{' '}
                    pour en générer un (compte Google protégé par la validation en deux étapes
                    requis).
                  </p>
                </div>

                <div className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Votre signature (optionnel)
                  </label>
                  <p className="mb-2 text-xs text-gray-500">
                    Cette signature sera ajoutée à la fin de tous les emails envoyés avec cette
                    configuration SMTP (par exemple&nbsp;: nom, fonction, coordonnées, mentions
                    légales…).
                  </p>
                  <div className="mt-1">
                    <Editor
                      ref={smtpSignatureEditorRef}
                      onReady={(methods) => {
                        // garder la ref synchronisée
                        smtpSignatureEditorRef.current = methods;
                        // injecter la signature existante dès que l’éditeur est prêt
                        if (smtpData.signature) {
                          methods.injectHTML(smtpData.signature);
                        }
                      }}
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

          {/* Section Google Calendar */}
          <div className="rounded-lg bg-white p-4 shadow sm:p-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                Intégration Google
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Connectez votre compte Google pour activer Google Meet et Drive dans le CRM.
              </p>
            </div>

            {googleLoading ? (
              <div className="mt-6 text-center text-gray-500">Chargement...</div>
            ) : googleAccount?.connected ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg
                        className="h-5 w-5 text-green-600"
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
                      <div>
                        <p className="text-sm font-medium text-green-800">Compte Google connecté</p>
                        {googleAccount.email && (
                          <p className="text-xs text-green-700">{googleAccount.email}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleGoogleDisconnect}
                      disabled={googleDisconnecting}
                      className="cursor-pointer rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {googleDisconnecting ? 'Déconnexion...' : 'Déconnecter'}
                    </button>
                  </div>
                </div>
                
              </div>
            ) : (
              <div className="mt-6">
                <button
                  onClick={handleGoogleConnect}
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Connecter mon compte Google
                </button>
              </div>
            )}
          </div>

          {/* Section Meta Lead Ads - Admin uniquement */}
          {isAdmin && (
            <div className="rounded-lg bg-white p-4 shadow sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                    Intégration Meta Lead Ads
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Importez automatiquement les leads de vos campagnes Meta (Facebook / Instagram)
                    en nouveaux contacts dans le CRM.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingMetaLeadConfig(null);
                    setMetaLeadFormData({
                      name: '',
                      active: true,
                      pageId: '',
                      accessToken: '',
                      verifyToken: '',
                      defaultStatusId: null,
                      defaultAssignedUserId: null,
                    });
                    setShowMetaLeadModal(true);
                    setMetaLeadError('');
                    setMetaLeadSuccess('');
                  }}
                  className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  + Ajouter
                </button>
              </div>

              {metaLeadSuccess && (
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
                    <p className="text-sm font-medium text-green-800">{metaLeadSuccess}</p>
                    <button
                      onClick={() => setMetaLeadSuccess('')}
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

              {metaLeadError && (
                <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  {metaLeadError}
                </div>
              )}

              {metaLeadLoading ? (
                <div className="mt-6 text-center text-gray-500">Chargement...</div>
              ) : metaLeadConfigs.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <p className="text-sm text-gray-600">Aucune configuration Meta Lead Ads</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Cliquez sur &quot;+ Ajouter&quot; pour créer votre première configuration
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {metaLeadConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{config.name}</h3>
                          {config.active ? (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              Actif
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                              Inactif
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Page ID: {config.pageId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditMetaLead(config)}
                          className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteMetaLead(config.id)}
                          className="cursor-pointer rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Meta Lead Ads */}
              {showMetaLeadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
                  <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white p-6 shadow-xl sm:p-8">
                    {/* En-tête fixe */}
                    <div className="shrink-0 border-b border-gray-100 pb-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                          {editingMetaLeadConfig ? 'Modifier' : 'Ajouter'} une configuration Meta
                          Lead Ads
                        </h2>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMetaLeadModal(false);
                            setEditingMetaLeadConfig(null);
                            setMetaLeadFormData({
                              name: '',
                              active: true,
                              pageId: '',
                              accessToken: '',
                              verifyToken: '',
                              defaultStatusId: null,
                              defaultAssignedUserId: null,
                            });
                            setMetaLeadError('');
                          }}
                          className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100"
                        >
                          <svg
                            className="h-6 w-6"
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

                    {/* Contenu scrollable */}
                    <form
                      id="meta-lead-form"
                      onSubmit={handleMetaLeadSubmit}
                      className="flex-1 space-y-4 overflow-y-auto pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nom de la configuration *
                        </label>
                        <input
                          type="text"
                          required
                          value={metaLeadFormData.name}
                          onChange={(e) =>
                            setMetaLeadFormData((prev) => ({ ...prev, name: e.target.value }))
                          }
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="Ex: Campagne Facebook Q4"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          id="meta-active"
                          type="checkbox"
                          checked={metaLeadFormData.active}
                          onChange={(e) =>
                            setMetaLeadFormData((prev) => ({ ...prev, active: e.target.checked }))
                          }
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label
                          htmlFor="meta-active"
                          className="ml-2 text-sm font-medium text-gray-700"
                        >
                          Activer l&apos;import automatique des leads Meta
                        </label>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            ID de la page Meta *
                          </label>
                          <input
                            type="text"
                            required
                            value={metaLeadFormData.pageId}
                            onChange={(e) =>
                              setMetaLeadFormData((prev) => ({ ...prev, pageId: e.target.value }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="123456789012345"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Token de vérification (Webhook) *
                          </label>
                          <input
                            type="text"
                            required
                            value={metaLeadFormData.verifyToken}
                            onChange={(e) =>
                              setMetaLeadFormData((prev) => ({
                                ...prev,
                                verifyToken: e.target.value,
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Choisissez un token secret"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Jeton d&apos;accès Meta (Page ou système) *
                            {editingMetaLeadConfig && (
                              <span className="ml-2 text-xs text-gray-500">
                                (Laissez vide pour ne pas modifier)
                              </span>
                            )}
                          </label>
                          <input
                            type="password"
                            required={!editingMetaLeadConfig}
                            value={metaLeadFormData.accessToken}
                            onChange={(e) =>
                              setMetaLeadFormData((prev) => ({
                                ...prev,
                                accessToken: e.target.value,
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="EAAB..."
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Ce jeton est chiffré et utilisé uniquement côté serveur.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Utilisateur assigné par défaut *
                          </label>
                          <select
                            required
                            value={metaLeadFormData.defaultAssignedUserId || ''}
                            onChange={(e) =>
                              setMetaLeadFormData((prev) => ({
                                ...prev,
                                defaultAssignedUserId: e.target.value || null,
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="">Sélectionnez un utilisateur</option>
                            {metaLeadUsers.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name} ({user.email})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Statut par défaut
                          </label>
                          <select
                            value={metaLeadFormData.defaultStatusId || ''}
                            onChange={(e) =>
                              setMetaLeadFormData((prev) => ({
                                ...prev,
                                defaultStatusId: e.target.value || null,
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="">Aucun statut par défaut</option>
                            {statuses.map((status) => (
                              <option key={status.id} value={status.id}>
                                {status.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
                        <p className="font-semibold">URL du webhook à renseigner dans Meta :</p>
                        <p className="mt-1 break-all text-gray-800">
                          {typeof window !== 'undefined'
                            ? `${window.location.origin}/api/webhooks/meta-leads`
                            : '/api/webhooks/meta-leads'}
                        </p>
                      </div>
                    </form>

                    {/* Pied de modal fixe */}
                    <div className="shrink-0 border-t border-gray-100 pt-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setShowMetaLeadModal(false);
                            setEditingMetaLeadConfig(null);
                            setMetaLeadFormData({
                              name: '',
                              active: true,
                              pageId: '',
                              accessToken: '',
                              verifyToken: '',
                              defaultStatusId: null,
                              defaultAssignedUserId: null,
                            });
                            setMetaLeadError('');
                          }}
                          className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          form="meta-lead-form"
                          disabled={metaLeadSaving}
                          className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                          {metaLeadSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section Google Ads Lead Forms - Admin uniquement */}
          {isAdmin && (
            <div className="rounded-lg bg-white p-4 shadow sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                    Intégration Google Ads (Lead Forms)
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Importez automatiquement les leads provenant des extensions de formulaire Google
                    Ads.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingGoogleAdsConfig(null);
                    setGoogleAdsFormData({
                      name: '',
                      active: true,
                      webhookKey: '',
                      defaultStatusId: null,
                      defaultAssignedUserId: null,
                    });
                    setShowGoogleAdsModal(true);
                    setGoogleAdsError('');
                    setGoogleAdsSuccess('');
                  }}
                  className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  + Ajouter
                </button>
              </div>

              {googleAdsSuccess && (
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
                    <p className="text-sm font-medium text-green-800">{googleAdsSuccess}</p>
                    <button
                      onClick={() => setGoogleAdsSuccess('')}
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

              {googleAdsError && (
                <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  {googleAdsError}
                </div>
              )}

              {googleAdsLoading ? (
                <div className="mt-6 text-center text-gray-500">Chargement...</div>
              ) : googleAdsConfigs.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <p className="text-sm text-gray-600">Aucune configuration Google Ads</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Cliquez sur &quot;+ Ajouter&quot; pour créer votre première configuration
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {googleAdsConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{config.name}</h3>
                          {config.active ? (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              Actif
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                              Inactif
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Webhook Key: {config.webhookKey.substring(0, 20)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditGoogleAds(config)}
                          className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteGoogleAds(config.id)}
                          className="cursor-pointer rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Google Ads */}
              {showGoogleAdsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
                  <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white p-6 shadow-xl sm:p-8">
                    {/* En-tête fixe */}
                    <div className="shrink-0 border-b border-gray-100 pb-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                          {editingGoogleAdsConfig ? 'Modifier' : 'Ajouter'} une configuration Google
                          Ads
                        </h2>
                        <button
                          type="button"
                          onClick={() => {
                            setShowGoogleAdsModal(false);
                            setEditingGoogleAdsConfig(null);
                            setGoogleAdsFormData({
                              name: '',
                              active: true,
                              webhookKey: '',
                              defaultStatusId: null,
                              defaultAssignedUserId: null,
                            });
                            setGoogleAdsError('');
                          }}
                          className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100"
                        >
                          <svg
                            className="h-6 w-6"
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

                    {/* Contenu scrollable */}
                    <form
                      id="google-ads-form"
                      onSubmit={handleGoogleAdsSubmit}
                      className="flex-1 space-y-4 overflow-y-auto pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nom de la configuration *
                        </label>
                        <input
                          type="text"
                          required
                          value={googleAdsFormData.name}
                          onChange={(e) =>
                            setGoogleAdsFormData((prev) => ({ ...prev, name: e.target.value }))
                          }
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="Ex: Campagne Google Ads Produits"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          id="google-ads-active"
                          type="checkbox"
                          checked={googleAdsFormData.active}
                          onChange={(e) =>
                            setGoogleAdsFormData((prev) => ({
                              ...prev,
                              active: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label
                          htmlFor="google-ads-active"
                          className="ml-2 text-sm font-medium text-gray-700"
                        >
                          Activer l&apos;import automatique des leads Google Ads
                        </label>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Clé secrète (webhook key) *
                          </label>
                          <input
                            type="text"
                            required
                            value={googleAdsFormData.webhookKey}
                            onChange={(e) =>
                              setGoogleAdsFormData((prev) => ({
                                ...prev,
                                webhookKey: e.target.value,
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Clé secrète à reporter dans Google Ads"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Utilisateur assigné par défaut *
                          </label>
                          <select
                            required
                            value={googleAdsFormData.defaultAssignedUserId || ''}
                            onChange={(e) =>
                              setGoogleAdsFormData((prev) => ({
                                ...prev,
                                defaultAssignedUserId: e.target.value || null,
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="">Sélectionnez un utilisateur</option>
                            {metaLeadUsers.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name} ({user.email})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Statut par défaut
                        </label>
                        <select
                          value={googleAdsFormData.defaultStatusId || ''}
                          onChange={(e) =>
                            setGoogleAdsFormData((prev) => ({
                              ...prev,
                              defaultStatusId: e.target.value || null,
                            }))
                          }
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="">Aucun statut par défaut</option>
                          {statuses.map((status) => (
                            <option key={status.id} value={status.id}>
                              {status.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
                        <p className="font-semibold">
                          URL du webhook à renseigner dans Google Ads :
                        </p>
                        <p className="mt-1 break-all text-gray-800">
                          {typeof window !== 'undefined'
                            ? `${window.location.origin}/api/webhooks/google-ads`
                            : '/api/webhooks/google-ads'}
                        </p>
                      </div>
                    </form>

                    {/* Pied de modal fixe */}
                    <div className="shrink-0 border-t border-gray-100 pt-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setShowGoogleAdsModal(false);
                            setEditingGoogleAdsConfig(null);
                            setGoogleAdsFormData({
                              name: '',
                              active: true,
                              webhookKey: '',
                              defaultStatusId: null,
                              defaultAssignedUserId: null,
                            });
                            setGoogleAdsError('');
                          }}
                          className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          form="google-ads-form"
                          disabled={googleAdsSaving}
                          className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                          {googleAdsSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section Google Sheets - Admin uniquement */}
          {isAdmin && (
            <div className="rounded-lg bg-white p-4 shadow sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                    Intégration Google Sheets
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Importez automatiquement des contacts à partir d&apos;un Google Sheet.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleSheetSync}
                    disabled={googleSheetSyncing}
                    className="cursor-pointer rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {googleSheetSyncing ? 'Synchronisation...' : 'Synchroniser'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingGoogleSheetConfig(null);
                      setGoogleSheetFormData({
                        name: '',
                        active: true,
                        sheetUrl: '',
                        sheetName: '',
                        headerRow: '1',
                        phoneColumn: '',
                        firstNameColumn: '',
                        lastNameColumn: '',
                        emailColumn: '',
                        cityColumn: '',
                        postalCodeColumn: '',
                        originColumn: '',
                        defaultStatusId: null,
                        defaultAssignedUserId: null,
                      });
                      setShowGoogleSheetModal(true);
                      setGoogleSheetError('');
                      setGoogleSheetSuccess('');
                    }}
                    className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    + Ajouter
                  </button>
                </div>
              </div>

              {googleSheetSuccess && (
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
                    <p className="text-sm font-medium text-green-800">{googleSheetSuccess}</p>
                    <button
                      onClick={() => setGoogleSheetSuccess('')}
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

              {googleSheetError && (
                <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  {googleSheetError}
                </div>
              )}

              {googleSheetLoading ? (
                <div className="mt-6 text-center text-gray-500">Chargement...</div>
              ) : googleSheetConfigs.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <p className="text-sm text-gray-600">Aucune configuration Google Sheets</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Cliquez sur &quot;+ Ajouter&quot; pour créer votre première configuration
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {googleSheetConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{config.name}</h3>
                          {config.active ? (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              Actif
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                              Inactif
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {config.sheetName} - Ligne {config.headerRow}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditGoogleSheet(config)}
                          className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteGoogleSheet(config.id)}
                          className="cursor-pointer rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Google Sheets */}
              {showGoogleSheetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 p-4 backdrop-blur-sm sm:p-6">
                  <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white p-6 shadow-xl sm:p-8">
                    {/* En-tête fixe */}
                    <div className="shrink-0 border-b border-gray-100 pb-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                          {editingGoogleSheetConfig ? 'Modifier' : 'Ajouter'} une configuration
                          Google Sheets
                        </h2>
                        <button
                          type="button"
                          onClick={() => {
                            setShowGoogleSheetModal(false);
                            setEditingGoogleSheetConfig(null);
                            setGoogleSheetFormData({
                              name: '',
                              active: true,
                              sheetUrl: '',
                              sheetName: '',
                              headerRow: '1',
                              phoneColumn: '',
                              firstNameColumn: '',
                              lastNameColumn: '',
                              emailColumn: '',
                              cityColumn: '',
                              postalCodeColumn: '',
                              originColumn: '',
                              defaultStatusId: null,
                              defaultAssignedUserId: null,
                            });
                            setGoogleSheetError('');
                          }}
                          className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100"
                        >
                          <svg
                            className="h-6 w-6"
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

                    {/* Contenu scrollable */}
                    <form
                      id="google-sheet-form"
                      onSubmit={handleGoogleSheetSubmit}
                      className="flex-1 space-y-4 overflow-y-auto pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nom de la configuration *
                        </label>
                        <input
                          type="text"
                          required
                          value={googleSheetFormData.name}
                          onChange={(e) =>
                            setGoogleSheetFormData((prev) => ({ ...prev, name: e.target.value }))
                          }
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="Ex: Contacts Ventes"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          id="google-sheet-active"
                          type="checkbox"
                          checked={googleSheetFormData.active}
                          onChange={(e) =>
                            setGoogleSheetFormData((prev) => ({
                              ...prev,
                              active: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label
                          htmlFor="google-sheet-active"
                          className="ml-2 text-sm font-medium text-gray-700"
                        >
                          Activer l&apos;import automatique depuis Google Sheets
                        </label>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Lien du Google Sheet *
                          </label>
                          <input
                            type="url"
                            required
                            value={googleSheetFormData.sheetUrl}
                            onChange={(e) =>
                              setGoogleSheetFormData((prev) => ({
                                ...prev,
                                sheetUrl: e.target.value,
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Nom de l&apos;onglet (Sheet) *
                          </label>
                          <input
                            type="text"
                            required
                            value={googleSheetFormData.sheetName}
                            onChange={(e) =>
                              setGoogleSheetFormData((prev) => ({
                                ...prev,
                                sheetName: e.target.value,
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Feuille 1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Ligne des en-têtes *
                          </label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={googleSheetFormData.headerRow}
                            onChange={(e) =>
                              setGoogleSheetFormData((prev) => ({
                                ...prev,
                                headerRow: e.target.value,
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Colonne Téléphone (obligatoire) *
                          </label>
                          <input
                            type="text"
                            required
                            value={googleSheetFormData.phoneColumn}
                            onChange={(e) =>
                              setGoogleSheetFormData((prev) => ({
                                ...prev,
                                phoneColumn: e.target.value.toUpperCase(),
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="A"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Colonne Prénom
                          </label>
                          <input
                            type="text"
                            value={googleSheetFormData.firstNameColumn}
                            onChange={(e) =>
                              setGoogleSheetFormData((prev) => ({
                                ...prev,
                                firstNameColumn: e.target.value.toUpperCase(),
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="B"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Colonne Nom
                          </label>
                          <input
                            type="text"
                            value={googleSheetFormData.lastNameColumn}
                            onChange={(e) =>
                              setGoogleSheetFormData((prev) => ({
                                ...prev,
                                lastNameColumn: e.target.value.toUpperCase(),
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="C"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Colonne Email
                          </label>
                          <input
                            type="text"
                            value={googleSheetFormData.emailColumn}
                            onChange={(e) =>
                              setGoogleSheetFormData((prev) => ({
                                ...prev,
                                emailColumn: e.target.value.toUpperCase(),
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="D"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Colonne Ville
                          </label>
                          <input
                            type="text"
                            value={googleSheetFormData.cityColumn}
                            onChange={(e) =>
                              setGoogleSheetFormData((prev) => ({
                                ...prev,
                                cityColumn: e.target.value.toUpperCase(),
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="E"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Colonne Code postal
                          </label>
                          <input
                            type="text"
                            value={googleSheetFormData.postalCodeColumn}
                            onChange={(e) =>
                              setGoogleSheetFormData((prev) => ({
                                ...prev,
                                postalCodeColumn: e.target.value.toUpperCase(),
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="F"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Colonne Origine
                          </label>
                          <input
                            type="text"
                            value={googleSheetFormData.originColumn}
                            onChange={(e) =>
                              setGoogleSheetFormData((prev) => ({
                                ...prev,
                                originColumn: e.target.value.toUpperCase(),
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="G"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Utilisateur assigné par défaut *
                          </label>
                          <select
                            required
                            value={googleSheetFormData.defaultAssignedUserId || ''}
                            onChange={(e) =>
                              setGoogleSheetFormData((prev) => ({
                                ...prev,
                                defaultAssignedUserId: e.target.value || null,
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="">Sélectionnez un utilisateur</option>
                            {metaLeadUsers.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name} ({user.email})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Statut par défaut
                          </label>
                          <select
                            value={googleSheetFormData.defaultStatusId || ''}
                            onChange={(e) =>
                              setGoogleSheetFormData((prev) => ({
                                ...prev,
                                defaultStatusId: e.target.value || null,
                              }))
                            }
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="">Aucun statut par défaut</option>
                            {statuses.map((status) => (
                              <option key={status.id} value={status.id}>
                                {status.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </form>

                    {/* Pied de modal fixe */}
                    <div className="shrink-0 border-t border-gray-100 pt-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setShowGoogleSheetModal(false);
                            setEditingGoogleSheetConfig(null);
                            setGoogleSheetFormData({
                              name: '',
                              active: true,
                              sheetUrl: '',
                              sheetName: '',
                              headerRow: '1',
                              phoneColumn: '',
                              firstNameColumn: '',
                              lastNameColumn: '',
                              emailColumn: '',
                              cityColumn: '',
                              postalCodeColumn: '',
                              originColumn: '',
                              defaultStatusId: null,
                              defaultAssignedUserId: null,
                            });
                            setGoogleSheetError('');
                          }}
                          className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          form="google-sheet-form"
                          disabled={googleSheetSaving}
                          className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                          {googleSheetSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
