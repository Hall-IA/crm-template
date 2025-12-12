'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface TasksPieChartProps {
  completed: number;
  pending: number;
}

const COLORS = {
  completed: '#10b981',
  pending: '#f59e0b',
};

export function TasksPieChart({ completed, pending }: TasksPieChartProps) {
  const data = [
    { name: 'Complétées', value: completed },
    { name: 'En attente', value: pending },
  ];

  const total = completed + pending;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Statut des Tâches</h3>
      <p className="mt-1 text-sm text-gray-500">Répartition des tâches</p>
      <div className="mt-6 flex items-center justify-center">
        <div className="relative h-[200px] w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === 'Complétées' ? COLORS.completed : COLORS.pending}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
              <p className="text-xs text-gray-500">Complétées</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <div>
            <p className="text-xs text-gray-500">Complétées</p>
            <p className="font-semibold text-gray-900">{completed}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <div>
            <p className="text-xs text-gray-500">En attente</p>
            <p className="font-semibold text-gray-900">{pending}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
