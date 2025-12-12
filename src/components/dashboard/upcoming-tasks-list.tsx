'use client';

import Link from 'next/link';
import { Calendar, Phone, Video, Mail, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
  contact: { id: string; name: string } | null;
  priority: string;
}

interface UpcomingTasksListProps {
  tasks: Task[];
}

const taskIcons = {
  CALL: Phone,
  MEETING: Calendar,
  EMAIL: Mail,
  VIDEO_CONFERENCE: Video,
  OTHER: CheckCircle2,
};

const priorityColors = {
  LOW: 'text-gray-500 bg-gray-100',
  MEDIUM: 'text-blue-600 bg-blue-100',
  HIGH: 'text-orange-600 bg-orange-100',
  URGENT: 'text-red-600 bg-red-100',
};

const priorityLabels = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  URGENT: 'Urgente',
};

export function UpcomingTasksList({ tasks }: UpcomingTasksListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Tâches à Venir</h3>
          <Link
            href="/agenda"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Voir tout
          </Link>
        </div>
        <div className="mt-6 text-center text-sm text-gray-500">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2">Aucune tâche à venir</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Tâches à Venir</h3>
        <Link href="/agenda" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          Voir tout
        </Link>
      </div>
      <div className="mt-6 space-y-4">
        {tasks.map((task) => {
          const Icon = taskIcons[task.type as keyof typeof taskIcons] || CheckCircle2;
          const scheduledDate = new Date(task.scheduledAt);

          return (
            <div
              key={task.id}
              className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
            >
              <div className="rounded-lg bg-indigo-100 p-2">
                <Icon className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    {task.contact && (
                      <Link
                        href={`/contacts/${task.contact.id}`}
                        className="text-sm text-gray-600 hover:text-indigo-600"
                      >
                        {task.contact.name}
                      </Link>
                    )}
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-1 text-xs font-medium',
                      priorityColors[task.priority as keyof typeof priorityColors],
                    )}
                  >
                    {priorityLabels[task.priority as keyof typeof priorityLabels]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {scheduledDate.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                  })}{' '}
                  à{' '}
                  {scheduledDate.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
