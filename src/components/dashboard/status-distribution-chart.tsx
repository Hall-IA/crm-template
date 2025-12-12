'use client';

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';

interface StatusDistributionChartProps {
  data: Array<{ name: string; value: number }>;
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Répartition par Statut</h3>
      <p className="mt-1 text-sm text-gray-500">Distribution des contacts selon leur statut</p>
      <div className="mt-6 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="name"
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <Radar
              name="Contacts"
              dataKey="value"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
