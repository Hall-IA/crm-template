'use client';

import { useViewAs } from '@/contexts/view-as-context';
import { Eye, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ViewAsBanner() {
  const { viewAsUser, clearViewAsUser, isViewingAsOther } = useViewAs();
  const router = useRouter();

  if (!isViewingAsOther || !viewAsUser) return null;

  const handleReturn = () => {
    clearViewAsUser();
    router.refresh();
  };

  return (
    <div className="shrink-0 bg-indigo-600 px-4 py-3 text-white shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="font-semibold">Mode vue utilisateur active</span>
            <span className="text-sm text-white/90">
              Vue : <span className="font-medium">{viewAsUser.name}</span>
              {viewAsUser.customRole && (
                <span className="ml-1">
                  ({viewAsUser.customRole.name})
                </span>
              )}
            </span>
          </div>
        </div>
        <button
          onClick={handleReturn}
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/30"
          aria-label="Revenir à ma vue"
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">Revenir à ma vue</span>
          <span className="sm:hidden">Retour</span>
        </button>
      </div>
    </div>
  );
}
