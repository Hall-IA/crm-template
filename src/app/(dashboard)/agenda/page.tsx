'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useUserRole } from '@/hooks/use-user-role';
import { PageHeader } from '@/components/page-header';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Video,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  type: 'CALL' | 'MEETING' | 'EMAIL' | 'OTHER';
  title: string | null;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  scheduledAt: string;
  completed: boolean;
  reminderMinutesBefore?: number | null;
  googleMeetLink?: string | null;
  durationMinutes?: number | null;
  contact: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  assignedUser: {
    id: string;
    name: string;
  };
}

const PRIORITY_COLORS = {
  LOW: '#10B981', // Vert
  MEDIUM: '#3B82F6', // Bleu
  HIGH: '#F59E0B', // Orange
  URGENT: '#EF4444', // Rouge
};

const PRIORITY_LABELS = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  URGENT: 'Urgente',
};

const TASK_TYPE_LABELS = {
  CALL: 'Appel téléphonique',
  MEETING: 'RDV',
  EMAIL: 'Email',
  OTHER: 'Autre',
};

export default function AgendaPage() {
  const { data: session } = useSession();
  const { isAdmin } = useUserRole();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  // Édition d'un Google Meet
  const [showEditMeetModal, setShowEditMeetModal] = useState(false);
  const [editingMeetTask, setEditingMeetTask] = useState<Task | null>(null);
  const [editMeetData, setEditMeetData] = useState<{
    scheduledAt: string;
    durationMinutes: number;
  }>({
    scheduledAt: '',
    durationMinutes: 30,
  });
  const [editMeetLoading, setEditMeetLoading] = useState(false);
  const [editMeetError, setEditMeetError] = useState('');

  // Calculer le début et la fin du mois/semaine/jour
  const getDateRange = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (view === 'month') {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
      return { start, end };
    } else if (view === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay() + 1); // Lundi
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59);
      return { start, end };
    } else {
      const start = new Date(currentDate);
      start.setHours(0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59);
      return { start, end };
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentDate, view]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      const response = await fetch(
        `/api/tasks?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
      );
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lundi = 0

    const days = [];
    // Jours du mois précédent
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
      });
    }
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      const taskDate = new Date(task.scheduledAt);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleTaskComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus }),
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
    }
  };

  const openEditMeetModal = (task: Task) => {
    const scheduled = new Date(task.scheduledAt);
    setEditingMeetTask(task);
    setEditMeetData({
      scheduledAt: scheduled.toISOString(),
      durationMinutes: task.durationMinutes ?? 30,
    });
    setEditMeetError('');
    setShowEditMeetModal(true);
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
        throw new Error(data.error || 'Erreur lors de la mise à jour du rendez-vous');
      }

      setShowEditMeetModal(false);
      setEditingMeetTask(null);
      setEditMeetLoading(false);
      await fetchTasks();
    } catch (error: any) {
      setEditMeetError(error.message || 'Erreur lors de la mise à jour du rendez-vous');
      setEditMeetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <PageHeader
        title="Agenda"
        description={`Vue ${
          view === 'month' ? 'mensuelle' : view === 'week' ? 'hebdomadaire' : 'quotidienne'
        } de vos tâches`}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="cursor-pointer rounded-lg border border-gray-300 p-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToToday}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="cursor-pointer rounded-lg border border-gray-300 p-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <select
              value={view}
              onChange={(e) => setView(e.target.value as 'month' | 'week' | 'day')}
              className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="month">Mois</option>
              <option value="week">Semaine</option>
              <option value="day">Jour</option>
            </select>
          </div>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-4 text-xl font-semibold text-gray-900">{formatDate(currentDate)}</div>

        {view === 'month' && (
          <div className="rounded-lg bg-white shadow">
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div
                  key={day}
                  className="border-r border-gray-200 p-3 text-center text-sm font-semibold text-gray-700 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {getDaysInMonth().map((day, index) => {
                const dayTasks = getTasksForDate(day.date);
                const isToday = day.date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] border-r border-b border-gray-200 p-2 last:border-r-0 ${
                      !day.isCurrentMonth ? 'bg-gray-50' : ''
                    } ${isToday ? 'bg-indigo-50' : ''}`}
                  >
                    <div
                      className={`mb-1 text-sm font-medium ${
                        isToday
                          ? 'text-indigo-600'
                          : day.isCurrentMonth
                            ? 'text-gray-900'
                            : 'text-gray-400'
                      }`}
                    >
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <Link
                          key={task.id}
                          href={task.contact ? `/contacts/${task.contact.id}` : '#'}
                          className={`block rounded px-1.5 py-0.5 text-xs transition-colors ${
                            task.contact ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                          }`}
                          style={{
                            backgroundColor: `${PRIORITY_COLORS[task.priority]}20`,
                            borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
                          }}
                          title={`${TASK_TYPE_LABELS[task.type]} - ${task.title || 'Sans titre'}`}
                          onClick={(e) => {
                            if (!task.contact) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <div className="truncate font-medium text-gray-900">
                            {formatTime(task.scheduledAt)}{' '}
                            {task.title || TASK_TYPE_LABELS[task.type]}
                          </div>
                        </Link>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-gray-500">+{dayTasks.length - 3} autre(s)</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Liste des tâches pour la vue semaine/jour */}
        {(view === 'week' || view === 'day') && (
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center shadow">
                <p className="text-gray-500">Aucune tâche pour cette période</p>
              </div>
            ) : (
              tasks.map((task) => {
                const TaskContent = (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskComplete(task.id, task.completed);
                          }}
                          className="cursor-pointer text-gray-400 hover:text-indigo-600"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: `${PRIORITY_COLORS[task.priority]}20`,
                                color: PRIORITY_COLORS[task.priority],
                              }}
                            >
                              {PRIORITY_LABELS[task.priority]}
                            </span>
                            <span className="text-sm text-gray-500">
                              {TASK_TYPE_LABELS[task.type]}
                            </span>
                          </div>
                          <h3
                            className={`mt-1 text-base font-semibold ${
                              task.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                            }`}
                          >
                            {task.title || TASK_TYPE_LABELS[task.type]}
                          </h3>
                          {task.contact && (
                            <div className="mt-1 inline-flex items-center gap-1 text-sm text-indigo-600">
                              <User className="h-4 w-4" />
                              {task.contact.firstName} {task.contact.lastName}
                            </div>
                          )}
                          {task.googleMeetLink && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (task.googleMeetLink) {
                                    window.open(
                                      task.googleMeetLink,
                                      '_blank',
                                      'noopener,noreferrer',
                                    );
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                              >
                                <Video className="h-4 w-4" />
                                <span>Rejoindre Google Meet</span>
                                <ExternalLink className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditMeetModal(task);
                                }}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                              >
                                Modifier le rendez-vous
                              </button>
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTime(task.scheduledAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(task.scheduledAt).toLocaleDateString('fr-FR')}
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {task.assignedUser.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );

                if (task.contact) {
                  return (
                    <Link
                      key={task.id}
                      href={`/contacts/${task.contact.id}`}
                      onClick={(e) => {
                        // Empêcher la navigation si on clique sur un bouton ou un lien
                        const target = e.target as HTMLElement;
                        if (
                          target.tagName === 'BUTTON' ||
                          target.closest('button') ||
                          target.tagName === 'A' ||
                          target.closest('a')
                        ) {
                          e.preventDefault();
                        }
                      }}
                      className="block rounded-lg border border-gray-200 bg-white p-4 shadow transition-colors hover:border-indigo-300 hover:shadow-md"
                    >
                      {TaskContent}
                    </Link>
                  );
                }

                return (
                  <div
                    key={task.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow"
                  >
                    {TaskContent}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Liste des tâches du mois (en bas) */}
        {view === 'month' && (
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Toutes les tâches du mois</h2>
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="rounded-lg bg-white p-8 text-center shadow">
                  <p className="text-gray-500">Aucune tâche pour ce mois</p>
                </div>
              ) : (
                tasks.map((task) => {
                  const TaskContent = (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskComplete(task.id, task.completed);
                            }}
                            className="cursor-pointer text-gray-400 hover:text-indigo-600"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                style={{
                                  backgroundColor: `${PRIORITY_COLORS[task.priority]}20`,
                                  color: PRIORITY_COLORS[task.priority],
                                }}
                              >
                                {PRIORITY_LABELS[task.priority]}
                              </span>
                              <span className="text-sm text-gray-500">
                                {TASK_TYPE_LABELS[task.type]}
                              </span>
                            </div>
                            <h3
                              className={`mt-1 text-base font-semibold ${
                                task.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                              }`}
                            >
                              {task.title || TASK_TYPE_LABELS[task.type]}
                            </h3>
                            {task.contact && (
                              <div className="mt-1 inline-flex items-center gap-1 text-sm text-indigo-600">
                                <User className="h-4 w-4" />
                                <span>
                                  {task.contact.firstName} {task.contact.lastName}
                                </span>
                              </div>
                            )}
                            {task.googleMeetLink && (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (task.googleMeetLink) {
                                      window.open(
                                        task.googleMeetLink,
                                        '_blank',
                                        'noopener,noreferrer',
                                      );
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                                >
                                  <Video className="h-4 w-4" />
                                  <span>Rejoindre Google Meet</span>
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditMeetModal(task);
                                  }}
                                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                                >
                                  Modifier le rendez-vous
                                </button>
                              </div>
                            )}
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(task.scheduledAt)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(task.scheduledAt).toLocaleDateString('fr-FR')}
                              </div>
                              {isAdmin && (
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {task.assignedUser.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                  if (task.contact) {
                    return (
                      <Link
                        key={task.id}
                        href={`/contacts/${task.contact.id}`}
                        onClick={(e) => {
                          // Empêcher la navigation si on clique sur un bouton ou un lien
                          const target = e.target as HTMLElement;
                          if (
                            target.tagName === 'BUTTON' ||
                            target.closest('button') ||
                            target.tagName === 'A' ||
                            target.closest('a')
                          ) {
                            e.preventDefault();
                          }
                        }}
                        className="block rounded-lg border border-gray-200 bg-white p-4 shadow transition-colors hover:border-indigo-300 hover:shadow-md"
                      >
                        {TaskContent}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={task.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow"
                    >
                      {TaskContent}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

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
                          : new Date(editingMeetTask.scheduledAt)
                              .toISOString()
                              .split('T')[1]
                              .slice(0, 5);
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
                        : new Date(editingMeetTask.scheduledAt)
                            .toISOString()
                            .split('T')[1]
                            .slice(0, 5)
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
