
import { AtomType, AtomSymbol, EvolutionParams, TargetProperty } from './types';

export const ATOM_CATALOG: Record<AtomSymbol, AtomType> = {
  [AtomSymbol.C]: { symbol: AtomSymbol.C, name: 'Carbon', maxValence: 4, color: '#4A5568', atomicMass: 12 }, // Gray-700
  [AtomSymbol.H]: { symbol: AtomSymbol.H, name: 'Hydrogen', maxValence: 1, color: '#E2E8F0', atomicMass: 1 }, // Gray-200 (light for contrast)
  [AtomSymbol.O]: { symbol: AtomSymbol.O, name: 'Oxygen', maxValence: 2, color: '#EF4444', atomicMass: 16 }, // Red-500
  [AtomSymbol.N]: { symbol: AtomSymbol.N, name: 'Nitrogen', maxValence: 3, color: '#3B82F6', atomicMass: 14 }, // Blue-500
};

export const AVAILABLE_ATOM_SYMBOLS = Object.values(AtomSymbol).filter(s => s !== AtomSymbol.H); // Exclude H from random generation for non-explicit H model

export const DEFAULT_EVOLUTION_PARAMS: EvolutionParams = {
  populationSize: 50,
  mutationRate: 0.1,
  maxGenerations: 100,
  elitismCount: 2,
  maxAtomsPerMolecule: 15,
};

export const DEFAULT_TARGET_PROPERTY: TargetProperty = TargetProperty.MAXIMIZE_BONDS;

export const TARGET_MOLECULAR_WEIGHT_GOAL = 50; // Example for TARGET_MOLECULAR_WEIGHT
export const TARGET_MOLECULAR_WEIGHT_RANGE_GOAL = { min: 40, max: 120 }; // Example for TARGET_MOLECULAR_WEIGHT_RANGE

// Lipinski's Rule of Five constants (approximations)
export const LIPINSKI_MAX_MW = 500;
export const LIPINSKI_MAX_H_DONORS = 5;
export const LIPINSKI_MAX_H_ACCEPTORS = 10;


export const TARGET_PROPERTY_DESCRIPTIONS: Record<TargetProperty, string> = {
  [TargetProperty.MAXIMIZE_ATOM_C]: "Evolve molecules with the highest number of Carbon atoms.",
  [TargetProperty.MAXIMIZE_ATOM_O]: "Evolve molecules with the highest number of Oxygen atoms.",
  [TargetProperty.MAXIMIZE_BONDS]: "Evolve molecules with the maximum number of chemical bonds (valence satisfaction is handled by Stability Score).",
  [TargetProperty.MINIMIZE_DISCONNECTED_COMPONENTS]: "Evolve molecules that are highly interconnected (fewer separate parts).",
  [TargetProperty.TARGET_MOLECULAR_WEIGHT]: `Evolve molecules with a molecular weight as close as possible to ${TARGET_MOLECULAR_WEIGHT_GOAL}.`,
  
  // New Descriptions
  [TargetProperty.STABILITY_SCORE_MAXIMIZE]: "Evolve molecules with higher stability, approximated by how well atoms satisfy their valences (filled valences are good, over/under are penalized).",
  [TargetProperty.TARGET_MOLECULAR_WEIGHT_RANGE]: `Evolve molecules with a molecular weight within the range of ${TARGET_MOLECULAR_WEIGHT_RANGE_GOAL.min} to ${TARGET_MOLECULAR_WEIGHT_RANGE_GOAL.max} Da.`,
  [TargetProperty.COUNT_HYDROXYL_GROUPS_MAXIMIZE]: "Evolve molecules with a higher count of (approximated) hydroxyl (-OH) groups.",
  [TargetProperty.COUNT_AMINE_GROUPS_MAXIMIZE]: "Evolve molecules with a higher count of (approximated) amine (-NHx) groups.",
  [TargetProperty.MAXIMIZE_ATOM_N]: "Evolve molecules with the highest number of Nitrogen atoms.",
  [TargetProperty.LIPINSKI_RULE_OF_FIVE_SCORE_MAXIMIZE]: `Evolve 'drug-like' molecules by maximizing a score based on Lipinski's Rule of Five (MW < ${LIPINSKI_MAX_MW}, approx. H-donors <= ${LIPINSKI_MAX_H_DONORS}, approx. H-acceptors <= ${LIPINSKI_MAX_H_ACCEPTORS}).`,
};