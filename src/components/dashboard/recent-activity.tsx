'use client';

import Link from 'next/link';
import {
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  TrendingUp,
  RefreshCw,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Interaction {
  id: string;
  type: string;
  title: string | null;
  content: string;
  date: string;
  contact: {
    id: string;
    name: string;
  };
}

interface RecentActivityProps {
  interactions: Interaction[];
}

const interactionIcons = {
  CALL: Phone,
  SMS: MessageSquare,
  EMAIL: Mail,
  MEETING: Calendar,
  NOTE: FileText,
  STATUS_CHANGE: TrendingUp,
  CONTACT_UPDATE: RefreshCw,
  APPOINTMENT_CREATED: CalendarCheck,
  APPOINTMENT_DELETED: CalendarX,
  APPOINTMENT_CHANGED: CalendarClock,
  ASSIGNMENT_CHANGE: UserCheck,
};

const interactionColors = {
  CALL: 'bg-blue-100 text-blue-600',
  SMS: 'bg-green-100 text-green-600',
  EMAIL: 'bg-purple-100 text-purple-600',
  MEETING: 'bg-indigo-100 text-indigo-600',
  NOTE: 'bg-gray-100 text-gray-600',
  STATUS_CHANGE: 'bg-amber-100 text-amber-600',
  CONTACT_UPDATE: 'bg-cyan-100 text-cyan-600',
  APPOINTMENT_CREATED: 'bg-emerald-100 text-emerald-600',
  APPOINTMENT_DELETED: 'bg-red-100 text-red-600',
  APPOINTMENT_CHANGED: 'bg-orange-100 text-orange-600',
  ASSIGNMENT_CHANGE: 'bg-pink-100 text-pink-600',
};

const interactionLabels = {
  CALL: 'Appel',
  SMS: 'SMS',
  EMAIL: 'Email',
  MEETING: 'Réunion',
  NOTE: 'Note',
  STATUS_CHANGE: 'Changement de statut',
  CONTACT_UPDATE: 'Mise à jour',
  APPOINTMENT_CREATED: 'RDV créé',
  APPOINTMENT_DELETED: 'RDV supprimé',
  APPOINTMENT_CHANGED: 'RDV modifié',
  ASSIGNMENT_CHANGE: 'Assignation',
};

export function RecentActivity({ interactions }: RecentActivityProps) {
  if (interactions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Activité Récente</h3>
        </div>
        <div className="mt-6 text-center text-sm text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2">Aucune activité récente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Activité Récente</h3>
      </div>
      <div className="mt-6 space-y-4">
        {interactions.map((interaction) => {
          const Icon =
            interactionIcons[interaction.type as keyof typeof interactionIcons] || FileText;
          const color =
            interactionColors[interaction.type as keyof typeof interactionColors] ||
            'bg-gray-100 text-gray-600';
          const label =
            interactionLabels[interaction.type as keyof typeof interactionLabels] ||
            interaction.type;
          const date = new Date(interaction.date);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMinutes = Math.floor(diffMs / (1000 * 60));

          let timeAgo = '';
          if (diffMinutes < 1) {
            timeAgo = "À l'instant";
          } else if (diffMinutes < 60) {
            timeAgo = `Il y a ${diffMinutes} min`;
          } else if (diffHours < 24) {
            timeAgo = `Il y a ${diffHours}h`;
          } else {
            timeAgo = date.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            });
          }

          return (
            <div
              key={interaction.id}
              className="flex items-start gap-3 border-l-2 border-gray-200 pl-3"
            >
              <div className={cn('rounded-lg p-2', color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <Link
                      href={`/contacts/${interaction.contact.id}`}
                      className="text-sm text-gray-600 hover:text-indigo-600"
                    >
                      {interaction.contact.name}
                    </Link>
                    {interaction.title && (
                      <p className="mt-1 text-xs text-gray-500">{interaction.title}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{timeAgo}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
