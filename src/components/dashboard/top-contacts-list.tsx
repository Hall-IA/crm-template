'use client';

import Link from 'next/link';
import { MessageSquare, Mail, Phone } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  interactionsCount: number;
  assignedCommercial?: string;
  assignedTelepro?: string;
}

interface TopContactsListProps {
  contacts: Contact[];
}

export function TopContactsList({ contacts }: TopContactsListProps) {
  if (contacts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Top Contacts</h3>
          <Link
            href="/contacts"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Voir tout
          </Link>
        </div>
        <div className="mt-6 text-center text-sm text-gray-500">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2">Aucun contact</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Top Contacts</h3>
        <Link
          href="/contacts"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Voir tout
        </Link>
      </div>
      <p className="mt-1 text-sm text-gray-500">Contacts avec le plus d'interactions</p>
      <div className="mt-6 space-y-4">
        {contacts.map((contact) => (
          <Link
            key={contact.id}
            href={`/contacts/${contact.id}`}
            className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <span className="font-semibold">{contact.name[0]?.toUpperCase() || '?'}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{contact.name}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {contact.phone}
                  </span>
                  {contact.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">Statut: {contact.status}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                <MessageSquare className="h-4 w-4 text-indigo-600" />
                {contact.interactionsCount}
              </div>
              <p className="text-xs text-gray-500">interactions</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
