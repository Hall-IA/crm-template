'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { useUserRole } from '@/hooks/use-user-role';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';

type Task = {
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
};

type Notification = { id: string; message: string; link?: string };

type TaskReminderContextValue = {
  notifications: Notification[];
  dismissNotification: (id: string) => void;
};

const TaskReminderContext = createContext<TaskReminderContextValue | undefined>(undefined);

const TASK_TYPE_LABELS: Record<Task['type'], string> = {
  CALL: 'Appel téléphonique',
  MEETING: 'RDV',
  EMAIL: 'Email',
  OTHER: 'Autre',
};

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TaskReminderProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { isAdmin } = useUserRole();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifiedKeysRef = useRef<Set<string>>(new Set());

  // Charger les tâches pertinentes pour les rappels
  useEffect(() => {
    if (!session) return;

    const fetchTasks = async () => {
      try {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 1); // hier
        const end = new Date(now);
        end.setDate(end.getDate() + 1); // demain

        const params = new URLSearchParams({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        });

        const response = await fetch(`/api/tasks?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des tâches pour les rappels:', error);
      }
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 5 * 60 * 1000); // rafraîchir toutes les 5 min
    return () => clearInterval(interval);
  }, [session, isAdmin]);

  // Génération des notifications
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const now = new Date();
      const newNotifications: Notification[] = [];
      const notified = new Set(notifiedKeysRef.current);

      tasks.forEach((task) => {
        if (task.completed) return;
        const scheduled = new Date(task.scheduledAt);

        // Notification à l'heure exacte de la tâche (fenêtre de 5 minutes)
        const dueKey = `${task.id}-due`;
        const diffMs = now.getTime() - scheduled.getTime();
        if (diffMs >= 0 && diffMs < 5 * 60 * 1000 && !notified.has(dueKey)) {
          notified.add(dueKey);
          newNotifications.push({
            id: dueKey,
            message: `Vous avez une tâche maintenant : ${
              task.title || TASK_TYPE_LABELS[task.type]
            } (${formatTime(task.scheduledAt)})`,
            link: task.contact ? `/contacts/${task.contact.id}` : undefined,
          });
        }

        // Notification de rappel avant l'heure
        if (task.reminderMinutesBefore != null && task.reminderMinutesBefore > 0) {
          const reminderMs = task.reminderMinutesBefore * 60 * 1000;
          const reminderTime = new Date(scheduled.getTime() - reminderMs);
          const reminderKey = `${task.id}-reminder`;
          const diffReminderMs = now.getTime() - reminderTime.getTime();

          if (
            diffReminderMs >= 0 &&
            diffReminderMs < 5 * 60 * 1000 &&
            now < scheduled &&
            !notified.has(reminderKey)
          ) {
            notified.add(reminderKey);
            newNotifications.push({
              id: reminderKey,
              message: `Rappel dans ${task.reminderMinutesBefore} min : ${
                task.title || TASK_TYPE_LABELS[task.type]
              } (${formatTime(task.scheduledAt)})`,
              link: task.contact ? `/contacts/${task.contact.id}` : undefined,
            });
          }
        }
      });

      if (newNotifications.length > 0) {
        setNotifications((prev) => [...prev, ...newNotifications]);
        notifiedKeysRef.current = notified;
      }
    }, 60 * 1000); // vérif toutes les minutes

    return () => clearInterval(interval);
  }, [tasks, session]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <TaskReminderContext.Provider value={{ notifications, dismissNotification }}>
      {children}
      {notifications.length > 0 && (
        <div className="pointer-events-none fixed right-4 bottom-4 z-50 space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border border-indigo-100 bg-white p-4 shadow-xl"
            >
              <div className="mt-0.5 rounded-full bg-indigo-50 p-2 text-indigo-600">
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Rappel de tâche</p>
                <p className="mt-1 text-sm text-gray-700">{notif.message}</p>
                {notif.link && (
                  <Link
                    href={notif.link}
                    className="mt-2 inline-flex text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Ouvrir le contact
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissNotification(notif.id)}
                className="ml-2 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <span className="sr-only">Fermer</span>
                <X />
              </button>
            </div>
          ))}
        </div>
      )}
    </TaskReminderContext.Provider>
  );
}

export function useTaskReminders() {
  const ctx = useContext(TaskReminderContext);
  if (!ctx) {
    throw new Error('useTaskReminders doit être utilisé dans un TaskReminderProvider');
  }
  return ctx;
}
