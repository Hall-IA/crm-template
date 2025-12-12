'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  iconColor?: string;
  iconBgColor?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  iconColor = 'text-indigo-600',
  iconBgColor = 'bg-indigo-100',
}: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="mt-2 flex items-center gap-1 text-sm">
              <span
                className={cn('font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-gray-500">{trend.label}</span>
            </p>
          )}
        </div>
        <div className={cn('rounded-full p-3', iconBgColor)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </div>
    </div>
  );
}
