
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FitnessDataPoint } from '../types';

interface FitnessPlotProps {
  data: FitnessDataPoint[];
}

export const FitnessPlot: React.FC<FitnessPlotProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-100 border border-slate-300 rounded-md">
        <p className="text-slate-500">Fitness data will appear here once evolution starts.</p>
      </div>
    );
  }
  return (
    <div className="bg-white p-4 shadow-lg rounded-lg h-full">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Fitness Progression</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="generation" stroke="#64748b" />
          <YAxis stroke="#64748b" domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0.5rem', borderColor: '#cbd5e1' }}
            labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{fontSize: "0.875rem"}}/>
          <Line type="monotone" dataKey="bestFitness" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2 }} name="Best Fitness" />
          <Line type="monotone" dataKey="avgFitness" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} name="Average Fitness" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
    