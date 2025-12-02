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
        `/api/tasks?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
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
      day: "numeric"
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <PageHeader
        title="Agenda"
        description={`Vue ${view === 'month' ? 'mensuelle' : view === 'week' ? 'hebdomadaire' : 'quotidienne'} de vos tâches`}
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
        <div className="mb-4 text-xl font-semibold text-gray-900">
          {formatDate(currentDate)}
        </div>

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
                const isToday =
                  day.date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] border-b border-r border-gray-200 p-2 last:border-r-0 ${
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
                            {formatTime(task.scheduledAt)} {task.title || TASK_TYPE_LABELS[task.type]}
                          </div>
                        </Link>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayTasks.length - 3} autre(s)
                        </div>
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
                              task.completed ? 'line-through text-gray-400' : 'text-gray-900'
                            }`}
                          >
                            {task.title || TASK_TYPE_LABELS[task.type]}
                          </h3>
                          {task.contact && (
                            <Link
                              href={`/contacts/${task.contact.id}`}
                              className="mt-1 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                            >
                              <User className="h-4 w-4" />
                              {task.contact.firstName} {task.contact.lastName}
                            </Link>
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Toutes les tâches du mois
            </h2>
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
                                task.completed ? 'line-through text-gray-400' : 'text-gray-900'
                              }`}
                            >
                              {task.title || TASK_TYPE_LABELS[task.type]}
                            </h3>
                            {task.contact && (
                              <div className="mt-1 inline-flex items-center gap-1 text-sm text-indigo-600">
                                <User className="h-4 w-4" />
                                <span>{task.contact.firstName} {task.contact.lastName}</span>
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
    </div>
  );
}

