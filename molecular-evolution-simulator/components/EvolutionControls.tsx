
import React from 'react';
import { EvolutionParams, TargetProperty, SimulationStatus } from '../types';
import { PlayIcon, PauseIcon, RefreshCwIcon } from './IconComponents';
import { TARGET_PROPERTY_DESCRIPTIONS, DEFAULT_TARGET_PROPERTY, DEFAULT_EVOLUTION_PARAMS } from '../constants';

interface EvolutionControlsProps {
  params: EvolutionParams;
  targetProperty: TargetProperty;
  onParamsChange: <K extends keyof EvolutionParams>(key: K, value: EvolutionParams[K]) => void;
  onTargetPropertyChange: (value: TargetProperty) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  simulationStatus: SimulationStatus;
  currentGeneration: number;
}

const Slider: React.FC<{
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit?: string;
  onChange: (value: number) => void;
  tooltip?: string;
}> = ({ id, label, min, max, step, value, unit, onChange, tooltip }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
      {label} {tooltip && <span title={tooltip} className="text-blue-500 cursor-help">(?)</span>}
    </label>
    <div className="flex items-center space-x-2">
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-thumb"
      />
      <span className="text-sm text-slate-600 w-16 text-right">{value}{unit}</span>
    </div>
  </div>
);


export const EvolutionControls: React.FC<EvolutionControlsProps> = ({
  params,
  targetProperty,
  onParamsChange,
  onTargetPropertyChange,
  onStart,
  onPause,
  onResume,
  onReset,
  simulationStatus,
  currentGeneration
}) => {
  const isRunning = simulationStatus === SimulationStatus.RUNNING;
  const isPaused = simulationStatus === SimulationStatus.PAUSED;
  const isIdle = simulationStatus === SimulationStatus.IDLE || simulationStatus === SimulationStatus.COMPLETED;

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg h-full overflow-y-auto">
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Evolution Controls</h2>

      <div className="mb-4">
        <label htmlFor="targetProperty" className="block text-sm font-medium text-slate-700 mb-1">Target Property</label>
        <select
          id="targetProperty"
          value={targetProperty}
          onChange={(e) => onTargetPropertyChange(e.target.value as TargetProperty)}
          disabled={isRunning || isPaused}
          className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          {Object.values(TargetProperty).map(prop => (
            <option key={prop} value={prop}>{prop.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">{TARGET_PROPERTY_DESCRIPTIONS[targetProperty]}</p>
      </div>

      <Slider
        id="populationSize"
        label="Population Size"
        min={10} max={200} step={10}
        value={params.populationSize}
        onChange={(v) => onParamsChange('populationSize', v)}
        tooltip="Number of molecules in each generation."
      />
      <Slider
        id="mutationRate"
        label="Mutation Rate"
        min={0.01} max={0.5} step={0.01}
        value={params.mutationRate}
        unit="%"
        onChange={(v) => onParamsChange('mutationRate', v)}
        tooltip="Probability of a mutation occurring in an offspring."
      />
      <Slider
        id="maxGenerations"
        label="Max Generations"
        min={10} max={500} step={10}
        value={params.maxGenerations}
        onChange={(v) => onParamsChange('maxGenerations', v)}
        tooltip="Maximum number of generations the simulation will run for."
      />
      <Slider
        id="elitismCount"
        label="Elitism Count"
        min={0} max={10} step={1}
        value={params.elitismCount}
        onChange={(v) => onParamsChange('elitismCount', v)}
        tooltip="Number of best molecules carried over to the next generation without mutation."
      />
      <Slider
        id="maxAtomsPerMolecule"
        label="Max Atoms per Molecule"
        min={2} max={30} step={1}
        value={params.maxAtomsPerMolecule}
        onChange={(v) => onParamsChange('maxAtomsPerMolecule', v)}
        tooltip="Maximum number of atoms a single molecule can have."
      />

      <div className="mt-8 flex space-x-3">
        {isIdle && (
          <button
            onClick={onStart}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors duration-150 flex items-center justify-center space-x-2"
          >
            <PlayIcon className="w-5 h-5" />
            <span>Start</span>
          </button>
        )}
        {isRunning && (
          <button
            onClick={onPause}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors duration-150 flex items-center justify-center space-x-2"
          >
            <PauseIcon className="w-5 h-5" />
            <span>Pause</span>
          </button>
        )}
        {isPaused && (
          <button
            onClick={onResume}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors duration-150 flex items-center justify-center space-x-2"
          >
            <PlayIcon className="w-5 h-5" />
            <span>Resume</span>
          </button>
        )}
        <button
          onClick={onReset}
          disabled={isRunning}
          className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCwIcon className="w-5 h-5" />
          <span>Reset</span>
        </button>
      </div>
      {simulationStatus !== SimulationStatus.IDLE && (
         <p className="mt-4 text-sm text-slate-600 text-center">
            Status: {simulationStatus} {simulationStatus !== SimulationStatus.COMPLETED && `| Generation: ${currentGeneration}/${params.maxGenerations}`}
        </p>
      )}
       {simulationStatus === SimulationStatus.COMPLETED && (
         <p className="mt-4 text-sm text-green-600 font-semibold text-center">
            Evolution Completed at Generation {currentGeneration}.
        </p>
      )}
    </div>
  );
};
    