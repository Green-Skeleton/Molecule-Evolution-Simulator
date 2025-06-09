import { Molecule, AtomSymbol, Atom } from '../types';
import { ATOM_CATALOG } from '../constants';

/**
 * Calculates the molecular weight of a molecule.
 * @param molecule The molecule to calculate the weight for.
 * @returns The calculated molecular weight.
 */
export const getMolecularWeight = (molecule: Molecule | { atoms: Atom[] }): number => {
  if (!molecule || !molecule.atoms) return 0;
  return molecule.atoms.reduce((sum, atom) => sum + (ATOM_CATALOG[atom.type]?.atomicMass || 0), 0);
};

/**
 * Generates a molecular formula string (e.g., C2N1O3) based on non-hydrogen atoms.
 * Atoms are ordered: C, then alphabetically for others.
 * Hydrogen is currently not explicitly part of random generation or this formula.
 * @param molecule The molecule to generate the formula for.
 * @returns A string representing the molecular formula.
 */
export const getMolecularFormula = (molecule: Molecule | { atoms: Atom[] }): string => {
  if (!molecule || !molecule.atoms || molecule.atoms.length === 0) return 'N/A';

  const atomCounts: Partial<Record<AtomSymbol, number>> = {};
  molecule.atoms.forEach(atom => {
    // We only count atoms defined in ATOM_CATALOG, excluding H for this formula
    if (atom.type !== AtomSymbol.H) {
      atomCounts[atom.type] = (atomCounts[atom.type] || 0) + 1;
    }
  });

  let formula = "";

  // Carbon first
  if (atomCounts[AtomSymbol.C]) {
    formula += `C${atomCounts[AtomSymbol.C]}`;
    delete atomCounts[AtomSymbol.C];
  }

  // Other elements alphabetically
  const otherSymbols = Object.keys(atomCounts).sort() as AtomSymbol[];
  otherSymbols.forEach(symbol => {
    formula += `${symbol}${atomCounts[symbol]}`;
  });

  return formula || 'N/A'; // Handle case where only H atoms might be present or no countable atoms
};
