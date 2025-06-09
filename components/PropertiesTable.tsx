import React from 'react';
import { Molecule, AtomSymbol } from '../types';
import { ATOM_CATALOG } from '../constants';
import { getMolecularWeight, getMolecularFormula } from '../utils/moleculeUtils';
import { DownloadIcon } from './IconComponents'; // Re-using DownloadIcon for PubChem link for now

interface PropertiesTableProps {
  molecule: Molecule | null;
}

export const PropertiesTable: React.FC<PropertiesTableProps> = ({ molecule }) => {
  if (!molecule) {
    return (
      <div className="bg-white p-4 shadow-lg rounded-lg h-full">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Molecular Properties</h3>
        <p className="text-slate-500">No molecule selected or available.</p>
      </div>
    );
  }

  const atomCounts: Record<AtomSymbol, number> = Object.values(AtomSymbol).reduce((acc, sym) => {
    acc[sym] = 0;
    return acc;
  }, {} as Record<AtomSymbol, number>);
  
  molecule.atoms.forEach(atom => {
    if (atomCounts[atom.type] !== undefined) {
      atomCounts[atom.type]++;
    }
  });

  const molecularWeight = getMolecularWeight(molecule);
  const molecularFormula = getMolecularFormula(molecule);

  const handleSearchPubChem = () => {
    if (molecularFormula && molecularFormula !== 'N/A') {
      const pubChemUrl = `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(molecularFormula)}`;
      window.open(pubChemUrl, '_blank');
    }
  };

  const properties = [
    { name: 'Fitness Score', value: molecule.fitness.toFixed(4) },
    { name: 'Molecular Formula (approx.)', value: molecularFormula },
    { name: 'Molecular Weight (approx.)', value: molecularWeight.toFixed(2) + ' Da' },
    { name: 'Number of Atoms', value: molecule.atoms.length },
    { name: 'Number of Bonds', value: molecule.bonds.length },
    ...Object.entries(atomCounts)
      .filter(([_, count]) => count > 0) // Only show atoms present
      .map(([symbol, count]) => ({
      name: `Count of ${ATOM_CATALOG[symbol as AtomSymbol]?.name || symbol}`,
      value: count
    }))
  ];

  return (
    <div className="bg-white p-4 shadow-lg rounded-lg h-full overflow-y-auto">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Best Molecule Properties</h3>
      <table className="w-full text-sm text-left text-slate-600">
        <tbody>
          {properties.map(prop => (
            <tr key={prop.name} className="border-b border-slate-200 hover:bg-slate-50">
              <th scope="row" className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">{prop.name}</th>
              <td className="py-2 px-3">{prop.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {molecularFormula && molecularFormula !== 'N/A' && (
        <button
          onClick={handleSearchPubChem}
          title={`Search PubChem for formula: ${molecularFormula}`}
          className="mt-4 w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors duration-150 flex items-center justify-center space-x-2 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" /></svg>
          <span>Search PubChem (Formula)</span>
        </button>
      )}
    </div>
  );
};