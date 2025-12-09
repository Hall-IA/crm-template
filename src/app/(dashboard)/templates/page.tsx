'use client';

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Plus, Edit, Trash2, Mail, MessageSquare, FileText, X, Info } from 'lucide-react';
import { Editor, type DefaultTemplateRef } from '@/components/editor';
import { AVAILABLE_VARIABLES } from '@/lib/template-variables';
import { TemplatesPageSkeleton } from '@/components/skeleton';

interface Template {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS' | 'NOTE';
  subject: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'EMAIL' | 'SMS' | 'NOTE'>('ALL');

  const [formData, setFormData] = useState({
    name: '',
    type: 'EMAIL' as 'EMAIL' | 'SMS' | 'NOTE',
    subject: '',
    content: '',
  });

  const emailEditorRef = useRef<DefaultTemplateRef | null>(null);
  const noteEditorRef = useRef<DefaultTemplateRef | null>(null);
  const smsTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const url = filterType === 'ALL' ? '/api/templates' : `/api/templates?type=${filterType}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        setError('Erreur lors du chargement des templates');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name) {
      setError('Le nom est requis');
      return;
    }

    // Récupérer le contenu depuis l'éditeur si c'est EMAIL ou NOTE
    let content = formData.content;
    if (formData.type === 'EMAIL' && emailEditorRef.current) {
      content = emailEditorRef.current.getHTML() || '';
    } else if (formData.type === 'NOTE' && noteEditorRef.current) {
      content = noteEditorRef.current.getHTML() || '';
    }

    // Validation du contenu
    if (!content || (typeof content === 'string' && content.trim() === '')) {
      setError('Le contenu est requis');
      return;
    }

    if (formData.type === 'EMAIL' && !formData.subject) {
      setError('Le sujet est requis pour les templates EMAIL');
      return;
    }

    try {

      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setSuccess(editingTemplate ? 'Template modifié avec succès !' : 'Template créé avec succès !');
      setShowModal(false);
      setEditingTemplate(null);
      setFormData({
        name: '',
        type: 'EMAIL',
        subject: '',
        content: '',
      });
      emailEditorRef.current?.injectHTML('');
      noteEditorRef.current?.injectHTML('');
      fetchTemplates();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setSuccess('Template supprimé avec succès !');
      fetchTemplates();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      content: template.content,
    });
    setShowModal(true);
    setError('');

    // Injecter le contenu dans l'éditeur après un court délai
    setTimeout(() => {
      if (template.type === 'EMAIL' && emailEditorRef.current) {
        emailEditorRef.current.injectHTML(template.content);
      } else if (template.type === 'NOTE' && noteEditorRef.current) {
        noteEditorRef.current.injectHTML(template.content);
      }
    }, 100);
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      type: 'EMAIL',
      subject: '',
      content: '',
    });
    setShowModal(true);
    setError('');
    setSuccess('');
    emailEditorRef.current?.injectHTML('');
    noteEditorRef.current?.injectHTML('');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return <Mail className="h-5 w-5" />;
      case 'SMS':
        return <MessageSquare className="h-5 w-5" />;
      case 'NOTE':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return 'Email';
      case 'SMS':
        return 'SMS';
      case 'NOTE':
        return 'Note';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SMS':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'NOTE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredTemplates = templates.filter(
    (t) => filterType === 'ALL' || t.type === filterType
  );

  if (loading) {
    return <TemplatesPageSkeleton />;
  }

  return (
    <div className="h-full">
      <PageHeader
        title="Templates"
        description="Gérez vos templates d'emails, SMS et notes"
        action={
          <button
            onClick={handleNewTemplate}
            className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <Plus className="mr-2 inline h-4 w-4" />
            Nouveau template
          </button>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-600">{success}</div>
        )}

        {/* Filtres */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('ALL')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilterType('EMAIL')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'EMAIL'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Mail className="mr-2 inline h-4 w-4" />
            Emails
          </button>
          <button
            onClick={() => setFilterType('SMS')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'SMS'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="mr-2 inline h-4 w-4" />
            SMS
          </button>
          <button
            onClick={() => setFilterType('NOTE')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'NOTE'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="mr-2 inline h-4 w-4" />
            Notes
          </button>
        </div>

        {/* Liste des templates */}
        {filteredTemplates.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <div className="text-4xl">📝</div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Aucun template</h2>
            <p className="mt-2 text-sm text-gray-600">
              {filterType === 'ALL'
                ? 'Commencez par créer votre premier template'
                : `Aucun template de type ${getTypeLabel(filterType)}`}
            </p>
            <button
              onClick={handleNewTemplate}
              className="mt-6 cursor-pointer rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Créer un template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    </div>
                    <span
                      className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getTypeColor(
                        template.type,
                      )}`}
                    >
                      {getTypeLabel(template.type)}
                    </span>
                    {template.type === 'EMAIL' && template.subject && (
                      <p className="mt-2 text-sm text-gray-600">
                        <strong>Sujet:</strong> {template.subject}
                      </p>
                    )}
                    <p className="mt-2 line-clamp-3 text-sm text-gray-500">
                      {template.content.replace(/<[^>]+>/g, '').substring(0, 100)}
                      {template.content.length > 100 && '...'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="cursor-pointer rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
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
                  {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTemplate(null);
                    setError('');
                  }}
                  className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Contenu scrollable */}
            <form
              id="template-form"
              onSubmit={handleSubmit}
              className="flex-1 space-y-6 overflow-y-auto pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom du template *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Ex: Email de bienvenue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      type: e.target.value as 'EMAIL' | 'SMS' | 'NOTE',
                      subject: e.target.value === 'EMAIL' ? formData.subject : '',
                    });
                  }}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="NOTE">Note</option>
                </select>
              </div>

              {formData.type === 'EMAIL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sujet *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Ex: Bienvenue dans notre CRM"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Contenu *</label>
                {(formData.type === 'EMAIL' || formData.type === 'NOTE') ? (
                  <div className="mt-1">
                    <Editor
                      ref={formData.type === 'EMAIL' ? emailEditorRef : noteEditorRef}
                      onReady={(methods) => {
                        if (formData.type === 'EMAIL') {
                          emailEditorRef.current = methods;
                        } else {
                          noteEditorRef.current = methods;
                        }
                        if (formData.content) {
                          methods.injectHTML(formData.content);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <textarea
                      ref={smsTextareaRef}
                      required
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={6}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Contenu du SMS..."
                    />
                  </div>
                )}

                {/* Section Variables */}
                <div className="mt-4 rounded-lg bg-blue-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-700">
                    Variables disponibles :
                  </p>
                  <p className="mb-3 text-xs text-gray-600">
                    Cliquez sur une variable pour l'insérer dans le contenu
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_VARIABLES.map((variable) => (
                      <button
                        key={variable.key}
                        type="button"
                        onClick={() => {
                          if (formData.type === 'EMAIL' && emailEditorRef.current) {
                            emailEditorRef.current.insertText(variable.key);
                          } else if (formData.type === 'NOTE' && noteEditorRef.current) {
                            noteEditorRef.current.insertText(variable.key);
                          } else if (formData.type === 'SMS' && smsTextareaRef.current) {
                            const textarea = smsTextareaRef.current;
                            const start = textarea.selectionStart || 0;
                            const end = textarea.selectionEnd || 0;
                            const text = formData.content;
                            const newText = text.substring(0, start) + variable.key + text.substring(end);
                            setFormData({ ...formData, content: newText });
                            // Repositionner le curseur après la variable insérée
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + variable.key.length, start + variable.key.length);
                            }, 0);
                          }
                        }}
                        className="cursor-pointer rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-mono text-blue-800 transition-colors hover:bg-blue-200"
                        title={variable.description}
                      >
                        {variable.key}
                      </button>
                    ))}
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
                    setEditingTemplate(null);
                    setError('');
                  }}
                  className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="template-form"
                  className="w-full cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 sm:w-auto"
                >
                  {editingTemplate ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

