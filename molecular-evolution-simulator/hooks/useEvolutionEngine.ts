import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Molecule, Atom, Bond, AtomSymbol, EvolutionParams, TargetProperty, FitnessDataPoint, SimulationStatus, MoleculeWithFitness
} from '../types';
import { 
    ATOM_CATALOG, AVAILABLE_ATOM_SYMBOLS, 
    TARGET_MOLECULAR_WEIGHT_GOAL, TARGET_MOLECULAR_WEIGHT_RANGE_GOAL,
    LIPINSKI_MAX_MW, LIPINSKI_MAX_H_DONORS, LIPINSKI_MAX_H_ACCEPTORS
} from '../constants';
import { getMolecularWeight } from '../utils/moleculeUtils'; // Import utility
import { v4 as uuidv4 } from 'uuid'; // For unique IDs

// --- Utility Functions (specific to evolution engine setup) ---
const getRandomAtomSymbol = (): AtomSymbol => AVAILABLE_ATOM_SYMBOLS[Math.floor(Math.random() * AVAILABLE_ATOM_SYMBOLS.length)];

const getAtomValence = (atomId: string, bonds: Bond[]): number => {
  return bonds.filter(b => b.source === atomId || b.target === atomId).length;
};

const createRandomMolecule = (maxAtoms: number): Molecule => {
  const numAtoms = Math.floor(Math.random() * (maxAtoms -1)) + 2; // 2 to maxAtoms
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];

  for (let i = 0; i < numAtoms; i++) {
    atoms.push({ id: uuidv4(), type: getRandomAtomSymbol() });
  }

  for (let i = 0; i < atoms.length * 1.5; i++) { 
    if (atoms.length < 2) break;
    const atom1 = atoms[Math.floor(Math.random() * atoms.length)];
    const atom2 = atoms[Math.floor(Math.random() * atoms.length)];

    if (atom1.id === atom2.id) continue; 

    const existingBond = bonds.find(b => 
      (b.source === atom1.id && b.target === atom2.id) || 
      (b.source === atom2.id && b.target === atom1.id)
    );
    if (existingBond) continue;

    const valence1 = getAtomValence(atom1.id, bonds);
    const valence2 = getAtomValence(atom2.id, bonds);

    if (valence1 < ATOM_CATALOG[atom1.type].maxValence && valence2 < ATOM_CATALOG[atom2.type].maxValence) {
      bonds.push({ id: uuidv4(), source: atom1.id, target: atom2.id });
    }
  }
  return { id: uuidv4(), atoms, bonds, fitness: 0 }; // Initial fitness 0
};

// --- Fitness Calculation ---
const calculateFitness = (molecule: Molecule, targetProperty: TargetProperty, params: EvolutionParams): number => {
  let fitness = 0;
  const molecularWeight = getMolecularWeight(molecule);

  switch (targetProperty) {
    case TargetProperty.MAXIMIZE_ATOM_C:
      fitness = molecule.atoms.filter(a => a.type === AtomSymbol.C).length;
      break;
    case TargetProperty.MAXIMIZE_ATOM_O:
      fitness = molecule.atoms.filter(a => a.type === AtomSymbol.O).length;
      break;
    case TargetProperty.MAXIMIZE_ATOM_N:
      fitness = molecule.atoms.filter(a => a.type === AtomSymbol.N).length;
      break;
    case TargetProperty.MAXIMIZE_BONDS:
      fitness = molecule.bonds.length;
      break;
    case TargetProperty.TARGET_MOLECULAR_WEIGHT:
      fitness = 1 / (1 + Math.abs(molecularWeight - TARGET_MOLECULAR_WEIGHT_GOAL));
      fitness *= 100; 
      break;
    case TargetProperty.MINIMIZE_DISCONNECTED_COMPONENTS:
      if (molecule.atoms.length === 0) return 0;
      const adj: Record<string, string[]> = {};
      molecule.atoms.forEach(a => adj[a.id] = []);
      molecule.bonds.forEach(b => {
        if(adj[b.source]) adj[b.source].push(b.target);
        if(adj[b.target]) adj[b.target].push(b.source);
      });
      let components = 0;
      const visited = new Set<string>();
      function dfs(nodeId: string) {
        visited.add(nodeId);
        (adj[nodeId] || []).forEach(neighborId => {
          if (!visited.has(neighborId)) dfs(neighborId);
        });
      }
      molecule.atoms.forEach(atom => {
        if (!visited.has(atom.id)) {
          dfs(atom.id);
          components++;
        }
      });
      fitness = 1 / (components || 1); 
      fitness *= molecule.atoms.length; 
      break;
    case TargetProperty.STABILITY_SCORE_MAXIMIZE:
      let stabilityScore = 0;
      if (molecule.atoms.length === 0) return 0;
      molecule.atoms.forEach(atom => {
        const currentValence = getAtomValence(atom.id, molecule.bonds);
        const maxValence = ATOM_CATALOG[atom.type].maxValence;
        if (currentValence === maxValence) {
          stabilityScore += 2; 
        } else if (currentValence < maxValence) {
          stabilityScore += 0.5; 
        } else { 
          stabilityScore -= (currentValence - maxValence) * 2; 
        }
      });
      fitness = stabilityScore / (molecule.atoms.length || 1);
      fitness = Math.max(0, fitness + 5); 
      break;
    case TargetProperty.TARGET_MOLECULAR_WEIGHT_RANGE:
      const { min, max } = TARGET_MOLECULAR_WEIGHT_RANGE_GOAL;
      if (molecularWeight >= min && molecularWeight <= max) {
        fitness = 100;
      } else if (molecularWeight < min) {
        fitness = 100 - (min - molecularWeight);
      } else { 
        fitness = 100 - (molecularWeight - max);
      }
      fitness = Math.max(0, fitness); 
      break;
    case TargetProperty.COUNT_HYDROXYL_GROUPS_MAXIMIZE:
      fitness = molecule.atoms.filter(atom => 
        atom.type === AtomSymbol.O && 
        getAtomValence(atom.id, molecule.bonds) === 1 &&
        ATOM_CATALOG[atom.type].maxValence === 2
      ).length;
      break;
    case TargetProperty.COUNT_AMINE_GROUPS_MAXIMIZE:
      fitness = molecule.atoms.filter(atom =>
        atom.type === AtomSymbol.N &&
        getAtomValence(atom.id, molecule.bonds) > 0 && 
        getAtomValence(atom.id, molecule.bonds) < ATOM_CATALOG[atom.type].maxValence
      ).length;
      break;
    case TargetProperty.LIPINSKI_RULE_OF_FIVE_SCORE_MAXIMIZE:
      let lipinskiScore = 0;
      if (molecularWeight <= LIPINSKI_MAX_MW) lipinskiScore++;
      let hDonors = 0;
      molecule.atoms.forEach(atom => {
        const valence = getAtomValence(atom.id, molecule.bonds);
        if (atom.type === AtomSymbol.O && valence === 1 && ATOM_CATALOG[AtomSymbol.O].maxValence === 2) {
          hDonors++; 
        } else if (atom.type === AtomSymbol.N) {
          const maxValenceN = ATOM_CATALOG[AtomSymbol.N].maxValence;
          if (valence < maxValenceN && valence > 0) {
             hDonors += (maxValenceN - valence); 
          }
        }
      });
      if (hDonors <= LIPINSKI_MAX_H_DONORS) lipinskiScore++;
      const hAcceptors = molecule.atoms.filter(a => a.type === AtomSymbol.O || a.type === AtomSymbol.N).length;
      if (hAcceptors <= LIPINSKI_MAX_H_ACCEPTORS) lipinskiScore++;
      fitness = lipinskiScore;
      break;
    default:
      fitness = 0;
  }
  return isNaN(fitness) ? 0 : Math.max(-1000, Math.min(1000, fitness));
};

// --- Evolutionary Operations ---
const selectParents = (population: MoleculeWithFitness[], elitismCount: number): MoleculeWithFitness[] => {
  const parents: MoleculeWithFitness[] = [];
  if (population.length === 0) return [];
  
  const sortedPopulation = [...population].sort((a, b) => b.fitness - a.fitness);
  
  for (let i = 0; i < elitismCount && i < sortedPopulation.length; i++) {
    parents.push(sortedPopulation[i]);
  }

  const tournamentSize = 3;
  while (parents.length < population.length) {
    let bestInTournament: MoleculeWithFitness | null = null;
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      const contender = population[randomIndex];
      if (!bestInTournament || contender.fitness > bestInTournament.fitness) {
        bestInTournament = contender;
      }
    }
    if (bestInTournament) parents.push(bestInTournament);
    else if (population.length > 0) parents.push(population[0]); 
  }
  return parents;
};

const mutateMolecule = (molecule: Molecule, mutationRate: number, maxAtoms: number): Molecule => {
  const newMolecule = JSON.parse(JSON.stringify(molecule)) as Molecule; 

  if (Math.random() < mutationRate && newMolecule.atoms.length > 0) {
    const atomIndex = Math.floor(Math.random() * newMolecule.atoms.length);
    const oldAtom = newMolecule.atoms[atomIndex];
    const newType = getRandomAtomSymbol();
    if (oldAtom.type !== newType) {
        oldAtom.type = newType;
        const maxValence = ATOM_CATALOG[newType].maxValence;
        const bondsOfAtom = newMolecule.bonds.filter(b => b.source === oldAtom.id || b.target === oldAtom.id);
        let bondsToRemoveCount = bondsOfAtom.length - maxValence;

        for(let k=0; k < bondsToRemoveCount && bondsOfAtom.length > 0; k++){
            const bondToRemoveIdx = newMolecule.bonds.findIndex(b => b.id === bondsOfAtom[k].id);
            if (bondToRemoveIdx !== -1) {
                 newMolecule.bonds.splice(bondToRemoveIdx, 1);
            }
        }
    }
  }

  if (Math.random() < mutationRate && newMolecule.atoms.length < maxAtoms) {
    const newAtom: Atom = { id: uuidv4(), type: getRandomAtomSymbol() };
    newMolecule.atoms.push(newAtom);
    if (newMolecule.atoms.length > 1) {
      const existingAtomIndex = Math.floor(Math.random() * (newMolecule.atoms.length - 1));
      const existingAtom = newMolecule.atoms[existingAtomIndex];
      const valNew = getAtomValence(newAtom.id, newMolecule.bonds);
      const valExisting = getAtomValence(existingAtom.id, newMolecule.bonds);
      if (valNew < ATOM_CATALOG[newAtom.type].maxValence && valExisting < ATOM_CATALOG[existingAtom.type].maxValence) {
        newMolecule.bonds.push({ id: uuidv4(), source: newAtom.id, target: existingAtom.id });
      }
    }
  }

  if (Math.random() < mutationRate && newMolecule.atoms.length > 1) { 
    const atomIndex = Math.floor(Math.random() * newMolecule.atoms.length);
    const removedAtomId = newMolecule.atoms[atomIndex].id;
    newMolecule.atoms.splice(atomIndex, 1);
    newMolecule.bonds = newMolecule.bonds.filter(b => b.source !== removedAtomId && b.target !== removedAtomId);
  }

  if (Math.random() < mutationRate && newMolecule.atoms.length >= 2) {
    const atom1Index = Math.floor(Math.random() * newMolecule.atoms.length);
    let atom2Index = Math.floor(Math.random() * newMolecule.atoms.length);
    while (atom1Index === atom2Index) atom2Index = Math.floor(Math.random() * newMolecule.atoms.length);
    const atom1 = newMolecule.atoms[atom1Index];
    const atom2 = newMolecule.atoms[atom2Index];
    const existingBond = newMolecule.bonds.find(b =>
      (b.source === atom1.id && b.target === atom2.id) || (b.source === atom2.id && b.target === atom1.id)
    );
    if (!existingBond) {
      const val1 = getAtomValence(atom1.id, newMolecule.bonds);
      const val2 = getAtomValence(atom2.id, newMolecule.bonds);
      if (val1 < ATOM_CATALOG[atom1.type].maxValence && val2 < ATOM_CATALOG[atom2.type].maxValence) {
        newMolecule.bonds.push({ id: uuidv4(), source: atom1.id, target: atom2.id });
      }
    }
  }

  if (Math.random() < mutationRate && newMolecule.bonds.length > 0) {
    const bondIndex = Math.floor(Math.random() * newMolecule.bonds.length);
    newMolecule.bonds.splice(bondIndex, 1);
  }
  
  newMolecule.id = uuidv4(); 
  return newMolecule; // Fitness will be recalculated
};

export const useEvolutionEngine = (initialParams: EvolutionParams, initialTargetProperty: TargetProperty) => {
  const [params, setParams] = useState<EvolutionParams>(initialParams);
  const [targetProperty, setTargetProperty] = useState<TargetProperty>(initialTargetProperty);
  
  const [population, setPopulation] = useState<MoleculeWithFitness[]>([]);
  const [currentGeneration, setCurrentGeneration] = useState<number>(0);
  const [bestMolecule, setBestMolecule] = useState<MoleculeWithFitness | null>(null);
  const [fitnessHistory, setFitnessHistory] = useState<FitnessDataPoint[]>([]);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>(SimulationStatus.IDLE);

  const evolutionTimeoutRef = useRef<number | null>(null);

  const evaluateAndSetPopulation = useCallback((mols: Molecule[]): MoleculeWithFitness[] => {
    const evaluated = mols.map(mol => ({
      ...mol,
      fitness: calculateFitness(mol, targetProperty, params)
    }));
    setPopulation(evaluated);
    return evaluated;
  }, [targetProperty, params]);

  const initializePopulation = useCallback(() => {
    const newPopulationRaw = Array.from({ length: params.populationSize }, () => createRandomMolecule(params.maxAtomsPerMolecule));
    evaluateAndSetPopulation(newPopulationRaw);
    setCurrentGeneration(0);
    setFitnessHistory([]);
    setBestMolecule(null);
  }, [params.populationSize, params.maxAtomsPerMolecule, evaluateAndSetPopulation]);
  
  const runGeneration = useCallback(() => {
    if (population.length === 0 && simulationStatus === SimulationStatus.RUNNING) {
        initializePopulation();
        return; 
    }
    if (population.length === 0) return;

    // Population should already be evaluated if coming from initialize or previous generation
    // If not, it implies a state issue or direct manipulation not intended
    const evaluatedPopulation = [...population]; // Already MoleculeWithFitness[]

    evaluatedPopulation.sort((a, b) => b.fitness - a.fitness);
    const currentBest = evaluatedPopulation[0];
    
    if (currentBest) {
        if (!bestMolecule || currentBest.fitness > bestMolecule.fitness) {
            setBestMolecule(currentBest);
        }
        const avgFitness = evaluatedPopulation.reduce((sum, mol) => sum + mol.fitness, 0) / evaluatedPopulation.length;
        setFitnessHistory(prev => [...prev, { generation: currentGeneration, bestFitness: currentBest.fitness, avgFitness: isNaN(avgFitness) ? 0 : avgFitness }]);
    } else if (population.length > 0) {
        setBestMolecule(population[0]); 
        setFitnessHistory(prev => [...prev, { generation: currentGeneration, bestFitness: 0, avgFitness: 0 }]);
    }

    if (currentGeneration >= params.maxGenerations) {
      setSimulationStatus(SimulationStatus.COMPLETED);
      return;
    }

    const parents = selectParents(evaluatedPopulation, params.elitismCount);
    if (parents.length === 0 && population.length > 0) {
        parents.push(...evaluatedPopulation.slice(0, Math.max(1, params.elitismCount)));
    }

    const nextGenerationRaw: Molecule[] = [];
    for (let i = 0; i < params.elitismCount && i < parents.length; i++) {
        if (parents[i]) nextGenerationRaw.push(JSON.parse(JSON.stringify(parents[i]))); 
    }
    
    if (parents.length > 0) {
        for (let i = nextGenerationRaw.length; i < params.populationSize; i++) {
            const parentIndex = Math.floor(Math.random() * parents.length);
            // Mutate returns Molecule, fitness will be recalculated by evaluateAndSetPopulation
            const offspring = mutateMolecule(parents[parentIndex], params.mutationRate, params.maxAtomsPerMolecule);
            nextGenerationRaw.push(offspring);
        }
    } else if (params.populationSize > 0) {
         for (let i = nextGenerationRaw.length; i < params.populationSize; i++) {
            nextGenerationRaw.push(createRandomMolecule(params.maxAtomsPerMolecule));
        }
    }
    
    evaluateAndSetPopulation(nextGenerationRaw);
    setCurrentGeneration(prev => prev + 1);

  }, [population, targetProperty, params, currentGeneration, bestMolecule, initializePopulation, simulationStatus, evaluateAndSetPopulation, params.elitismCount, params.maxAtomsPerMolecule, params.mutationRate, params.populationSize, params.maxGenerations]);

  useEffect(() => {
    if (simulationStatus === SimulationStatus.RUNNING) {
      evolutionTimeoutRef.current = window.setTimeout(() => {
        runGeneration();
      }, 50); 
    }
    return () => {
      if (evolutionTimeoutRef.current) {
        clearTimeout(evolutionTimeoutRef.current);
      }
    };
  }, [simulationStatus, runGeneration]);

  const startEvolution = useCallback(() => {
    setCurrentGeneration(0); 
    setFitnessHistory([]);   
    setBestMolecule(null);   
    initializePopulation();  
    setSimulationStatus(SimulationStatus.RUNNING); 
  }, [initializePopulation]);

  const startEvolutionFromSeed = useCallback((seedMolecule: Molecule) => {
    if (!seedMolecule) return;
    setCurrentGeneration(0);
    setFitnessHistory([]);
    
    const newPopulationRaw: Molecule[] = [];
    // Add seed as the first member (deep copy)
    const seedCopy = JSON.parse(JSON.stringify(seedMolecule)) as Molecule;
    newPopulationRaw.push(seedCopy);

    // Fill rest of population with mutations of the seed
    for (let i = 1; i < params.populationSize; i++) {
        const mutatedSeed = mutateMolecule(JSON.parse(JSON.stringify(seedMolecule)), params.mutationRate * 2, params.maxAtomsPerMolecule); // Higher initial mutation from seed maybe
        newPopulationRaw.push(mutatedSeed);
    }
    const evaluatedNewPopulation = evaluateAndSetPopulation(newPopulationRaw);
    // Set bestMolecule based on the new seeded population
    if (evaluatedNewPopulation.length > 0) {
        const sortedSeededPop = [...evaluatedNewPopulation].sort((a,b) => b.fitness - a.fitness);
        setBestMolecule(sortedSeededPop[0]);
    } else {
        setBestMolecule(null);
    }
    setSimulationStatus(SimulationStatus.RUNNING);
  }, [params.populationSize, params.mutationRate, params.maxAtomsPerMolecule, evaluateAndSetPopulation]);


  const pauseEvolution = useCallback(() => {
    setSimulationStatus(SimulationStatus.PAUSED);
  }, []);

  const resumeEvolution = useCallback(() => {
    if (currentGeneration < params.maxGenerations) {
       setSimulationStatus(SimulationStatus.RUNNING);
    } else {
       setSimulationStatus(SimulationStatus.COMPLETED);
    }
  }, [currentGeneration, params.maxGenerations]);

  const resetEvolution = useCallback((newParams: EvolutionParams, newTarget: TargetProperty) => {
    if (evolutionTimeoutRef.current) clearTimeout(evolutionTimeoutRef.current);
    setParams(newParams);
    setTargetProperty(newTarget);
    setPopulation([]); 
    setCurrentGeneration(0);
    setFitnessHistory([]);
    setBestMolecule(null);
    setSimulationStatus(SimulationStatus.IDLE);
  }, []);

  const updateParams = useCallback(<K extends keyof EvolutionParams>(key: K, value: EvolutionParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateTargetProperty = useCallback((value: TargetProperty) => {
    setTargetProperty(value);
  }, []);

  return {
    params,
    targetProperty,
    population, // Now exposed and contains MoleculeWithFitness[]
    currentGeneration,
    bestMolecule,
    fitnessHistory,
    simulationStatus,
    startEvolution,
    startEvolutionFromSeed, // New function
    pauseEvolution,
    resumeEvolution,
    resetEvolution,
    updateParams,
    updateTargetProperty,
  };
};