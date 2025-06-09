import React from 'react';
import { EvolutionControls } from './components/EvolutionControls';
import { MoleculeViewer } from './components/MoleculeViewer';
import { FitnessPlot } from './components/FitnessPlot';
import { PropertiesTable } from './components/PropertiesTable';
import { PopulationPlot } from './components/PopulationPlot'; // New import
import { useEvolutionEngine } from './hooks/useEvolutionEngine';
import { DEFAULT_EVOLUTION_PARAMS, DEFAULT_TARGET_PROPERTY } from './constants';
import { DownloadIcon, PlayIcon } from './components/IconComponents'; // Added PlayIcon
import { Molecule, SimulationStatus as AppSimulationStatus } from './types'; // Aliased SimulationStatus


const App: React.FC = () => {
  const {
    params,
    targetProperty,
    population, // Now used for PopulationPlot
    currentGeneration,
    bestMolecule,
    fitnessHistory,
    simulationStatus,
    startEvolution,
    startEvolutionFromSeed, // New function from hook
    pauseEvolution,
    resumeEvolution,
    resetEvolution,
    updateParams,
    updateTargetProperty,
  } = useEvolutionEngine(DEFAULT_EVOLUTION_PARAMS, DEFAULT_TARGET_PROPERTY);

  const handleReset = () => {
    resetEvolution(DEFAULT_EVOLUTION_PARAMS, DEFAULT_TARGET_PROPERTY);
  };

  const handleExportMolecule = () => {
    if (bestMolecule) {
      const jsonString = JSON.stringify(bestMolecule, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `best_molecule_gen${currentGeneration}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    }
  };

  const handleExportHistory = () => {
    if (fitnessHistory.length > 0) {
      const csvHeader = "generation,bestFitness,avgFitness\n";
      const csvRows = fitnessHistory.map(d => `${d.generation},${d.bestFitness.toFixed(4)},${d.avgFitness.toFixed(4)}`).join("\n");
      const csvString = csvHeader + csvRows;
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `evolution_history_gen${currentGeneration}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    }
  };

  const handleEvolveFromBest = () => {
    if (bestMolecule) {
      // We pass the plain Molecule structure, not MoleculeWithFitness, if the types differ in source
      const seed: Molecule = {
        id: bestMolecule.id, // Or generate new ID if preferred for a seed
        atoms: bestMolecule.atoms,
        bonds: bestMolecule.bonds,
        fitness: 0 // Fitness will be recalculated for the new population
      };
      startEvolutionFromSeed(seed);
    }
  };


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col p-4 lg:p-6">
      <header className="mb-6 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold text-blue-600">Molecular Evolution Simulator</h1>
        <p className="text-slate-600 mt-1 text-md lg:text-lg">Watch molecules evolve towards your defined chemical goals.</p>
      </header>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Controls Panel - Full height on large screens */}
        <div className="lg:col-span-1 lg:row-span-2"> {/* Make controls span 2 rows in the conceptual grid */}
          <EvolutionControls
            params={params}
            targetProperty={targetProperty}
            onParamsChange={updateParams}
            onTargetPropertyChange={updateTargetProperty}
            onStart={startEvolution}
            onPause={pauseEvolution}
            onResume={resumeEvolution}
            onReset={handleReset}
            simulationStatus={simulationStatus}
            currentGeneration={currentGeneration}
          />
        </div>

        {/* Top Row of Display Panels */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white p-3 lg:p-4 shadow-lg rounded-lg">
            <h3 className="text-md lg:text-lg font-semibold text-slate-700 mb-2 flex items-center justify-between">
              Best Molecule Viewer
              <div>
                {bestMolecule && (
                  <>
                    <button
                      onClick={handleEvolveFromBest}
                      title="Evolve new population from this molecule"
                      className="p-1 text-green-500 hover:text-green-700 disabled:opacity-50"
                      disabled={simulationStatus === AppSimulationStatus.RUNNING || simulationStatus === AppSimulationStatus.PAUSED}
                    >
                      <PlayIcon className="w-5 h-5" /> {/* Using Play as "start new from this" */}
                    </button>
                    <button 
                      onClick={handleExportMolecule} 
                      title="Export Best Molecule (JSON)"
                      className="ml-2 p-1 text-blue-500 hover:text-blue-700"
                    >
                      <DownloadIcon className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </h3>
            <MoleculeViewer molecule={bestMolecule} width={undefined} height={260} />
          </div>
          <PropertiesTable molecule={bestMolecule} />
        </div>
        
        {/* Bottom Row of Display Panels */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white p-3 lg:p-4 shadow-lg rounded-lg min-h-[300px] md:min-h-[350px]">
            <h3 className="text-md lg:text-lg font-semibold text-slate-700 mb-2 flex items-center justify-between">
              Fitness Plot
              {fitnessHistory.length > 0 && (
                <button 
                  onClick={handleExportHistory} 
                  title="Export Fitness History (CSV)"
                  className="p-1 text-blue-500 hover:text-blue-700"
                >
                  <DownloadIcon className="w-5 h-5" />
                </button>
              )}
            </h3>
            <FitnessPlot data={fitnessHistory} />
          </div>
          <div className="bg-white p-3 l0g:p-4 shadow-lg rounded-lg min-h-[300px] md:min-h-[350px]">
             {/* PopulationPlot will take full height of this div */}
            <PopulationPlot population={population} currentGeneration={currentGeneration} />
          </div>
        </div>
      </div>

       <footer className="mt-6 lg:mt-8 text-center text-xs lg:text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Molecular Evolution. All rights reserved.</p>
        <p className="mt-1">This is a simplified simulation for illustrative purposes.</p>
      </footer>
    </div>
  );
};

export default App;