import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis } from 'recharts';
import { MoleculeWithFitness } from '../types';
import { getMolecularWeight } from '../utils/moleculeUtils';

interface PopulationPlotProps {
  population: MoleculeWithFitness[];
  currentGeneration: number;
}

interface PlotDataPoint {
  mw: number;
  fitness: number;
  id: string;
  numAtoms: number;
}

export const PopulationPlot: React.FC<PopulationPlotProps> = ({ population, currentGeneration }) => {
  if (!population || population.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 border border-slate-300 rounded-md p-4">
        <p className="text-slate-500 text-center">Population data will appear here once evolution starts.</p>
      </div>
    );
  }

  const plotData: PlotDataPoint[] = population.map(mol => ({
    mw: getMolecularWeight(mol),
    fitness: mol.fitness,
    id: mol.id.substring(0, 8), // Short ID for tooltip
    numAtoms: mol.atoms.length,
  }));

  return (
    <div className="bg-white p-4 shadow-lg rounded-lg h-full flex flex-col">
      <h3 className="text-lg font-semibold text-slate-700 mb-1">
        Population Snapshot <span className="text-sm font-normal">(Gen: {currentGeneration})</span>
      </h3>
       <p className="text-xs text-slate-500 mb-3">Each point is a molecule. X: Molecular Weight, Y: Fitness Score, Size: Number of Atoms.</p>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 5, right: 20, bottom: 20, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="mw" 
            type="number" 
            name="Molecular Weight" 
            unit=" Da" 
            stroke="#64748b"
            label={{ value: "Molecular Weight (Da)", position: 'insideBottom', offset: -10, fontSize: '0.75rem', fill: '#4A5568' }}
            domain={['auto', 'auto']}
            tick={{fontSize: '0.65rem'}}
          />
          <YAxis 
            dataKey="fitness" 
            type="number" 
            name="Fitness" 
            stroke="#64748b"
            label={{ value: "Fitness Score", angle: -90, position: 'insideLeft', offset: 10, fontSize: '0.75rem', fill: '#4A5568' }}
            domain={['auto', 'auto']}
            tick={{fontSize: '0.65rem'}}
            width={70}
          />
          <ZAxis dataKey="numAtoms" type="number" range={[20, 200]} name="Number of Atoms" unit="" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0.5rem', borderColor: '#cbd5e1' }}
            labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
            formatter={(value: any, name: any) => [typeof value === 'number' ? value.toFixed(2) : value, name]}
          />
          <Legend wrapperStyle={{fontSize: "0.8rem", paddingTop: '10px'}}/>
          <Scatter name="Molecules" data={plotData} fill="#2563EB" shape="circle" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};