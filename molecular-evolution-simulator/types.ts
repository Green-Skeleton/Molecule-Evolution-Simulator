export enum AtomSymbol {
  C = 'C', // Carbon
  H = 'H', // Hydrogen
  O = 'O', // Oxygen
  N = 'N', // Nitrogen
}

export interface AtomType {
  symbol: AtomSymbol;
  name: string;
  maxValence: number;
  color: string;
  atomicMass: number; // For potential future fitness functions
}

export interface Atom {
  id: string;
  type: AtomSymbol;
  x?: number;
  y?: number;
  fx?: number | null; // For D3 fixed position
  fy?: number | null; // For D3 fixed position
}

export interface Bond {
  id:string; // Unique ID for the bond, e.g., `${atom1.id}-${atom2.id}`
  source: string; // Atom ID
  target: string; // Atom ID
}

export interface Molecule {
  id: string;
  atoms: Atom[];
  bonds: Bond[];
  fitness: number;
}

// For use when fitness is guaranteed to be calculated, e.g. in evaluated populations
export interface MoleculeWithFitness extends Molecule {
  fitness: number;
}


export enum TargetProperty {
  // Existing
  MAXIMIZE_ATOM_C = 'MAXIMIZE_ATOM_C',
  MAXIMIZE_ATOM_O = 'MAXIMIZE_ATOM_O',
  MAXIMIZE_BONDS = 'MAXIMIZE_BONDS',
  MINIMIZE_DISCONNECTED_COMPONENTS = 'MINIMIZE_DISCONNECTED_COMPONENTS',
  TARGET_MOLECULAR_WEIGHT = 'TARGET_MOLECULAR_WEIGHT',

  // New Additions
  STABILITY_SCORE_MAXIMIZE = 'STABILITY_SCORE_MAXIMIZE', // Approximated by valence satisfaction
  TARGET_MOLECULAR_WEIGHT_RANGE = 'TARGET_MOLECULAR_WEIGHT_RANGE', // Target MW within a defined range

  COUNT_HYDROXYL_GROUPS_MAXIMIZE = 'COUNT_HYDROXYL_GROUPS_MAXIMIZE', // Approximate count of -OH groups
  COUNT_AMINE_GROUPS_MAXIMIZE = 'COUNT_AMINE_GROUPS_MAXIMIZE', // Approximate count of -NHx groups
  MAXIMIZE_ATOM_N = 'MAXIMIZE_ATOM_N', // Maximizes Nitrogen atoms

  LIPINSKI_RULE_OF_FIVE_SCORE_MAXIMIZE = 'LIPINSKI_RULE_OF_FIVE_SCORE_MAXIMIZE', // Score based on Lipinski's rules (MW, H-donors, H-acceptors)
}

export interface EvolutionParams {
  populationSize: number;
  mutationRate: number; // 0.0 - 1.0
  maxGenerations: number;
  elitismCount: number; // Number of best individuals to carry over
  maxAtomsPerMolecule: number;
}

export interface FitnessDataPoint {
  generation: number;
  bestFitness: number;
  avgFitness: number;
}

export enum SimulationStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}