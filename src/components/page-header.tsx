'use client';

import { useMobileMenuContext } from '@/contexts/mobile-menu-context';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  const { isOpen, toggle } = useMobileMenuContext();

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <div className="flex items-start gap-3">
        {/* Mobile menu button */}
        <button
          onClick={toggle}
          className="mt-1 shrink-0 cursor-pointer rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 lg:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
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

        <div className="min-w-0 flex-1">
          {action ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
                {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
              </div>
              <div className="shrink-0">{action}</div>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
              {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
