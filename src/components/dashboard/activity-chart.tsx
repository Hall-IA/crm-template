'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';

interface ActivityChartProps {
  data: Array<{ date: string; interactions: number; tasks: number }>;
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Activité des 7 Derniers Jours</h3>
      <p className="mt-1 text-sm text-gray-500">Interactions et tâches créées</p>
      <div className="mt-6 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="interactions" fill="#6366f1" radius={[4, 4, 0, 0]} name="Interactions" />
            <Bar dataKey="tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Tâches" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
