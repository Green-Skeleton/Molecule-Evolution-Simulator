
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Molecule, Atom, Bond } from '../types';
import { ATOM_CATALOG } from '../constants';

interface MoleculeViewerProps {
  molecule: Molecule | null;
  width?: number;
  height?: number;
}

interface D3Node extends d3.SimulationNodeDatum, Atom {}
interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  id: string;
  source: string | D3Node;
  target: string | D3Node;
}

export const MoleculeViewer: React.FC<MoleculeViewerProps> = ({ molecule, width = 400, height = 300 }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !molecule) {
      if (svgRef.current) {
         d3.select(svgRef.current).selectAll("*").remove(); // Clear previous rendering if molecule is null
      }
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous rendering

    const nodes: D3Node[] = JSON.parse(JSON.stringify(molecule.atoms)); // Deep copy
    const links: D3Link[] = JSON.parse(JSON.stringify(molecule.bonds.map(b => ({...b, id: b.id}))));


    if (simulationRef.current) {
      simulationRef.current.stop();
    }
    
    simulationRef.current = d3.forceSimulation<D3Node, D3Link>(nodes)
      .force("link", d3.forceLink<D3Node, D3Link>(links).id(d => (d as D3Node).id).distance(50))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(15));


    const linkElements = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(3)); // Example: bond strength visualization

    const nodeElements = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(drag(simulationRef.current) as any);

    nodeElements.append("circle")
      .attr("r", 10)
      .attr("fill", d => ATOM_CATALOG[d.type]?.color || '#ccc')
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    nodeElements.append("text")
      .text(d => ATOM_CATALOG[d.type]?.symbol || '?')
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", d => (ATOM_CATALOG[d.type]?.symbol === 'H' ? '#333' : '#fff'));
      

    simulationRef.current.on("tick", () => {
      linkElements
        .attr("x1", d => (d.source as D3Node).x!)
        .attr("y1", d => (d.source as D3Node).y!)
        .attr("x2", d => (d.target as D3Node).x!)
        .attr("y2", d => (d.target as D3Node).y!);

      nodeElements
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });
    
    // Clean up simulation on component unmount
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };

  }, [molecule, width, height]);

  const drag = (simulation: d3.Simulation<D3Node, D3Link>) => {
    function dragstarted(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    return d3.drag<SVGGElement, D3Node>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }


  if (!molecule) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center bg-slate-100 border border-slate-300 rounded-md">
        <p className="text-slate-500">No molecule to display.</p>
      </div>
    );
  }

  return <svg ref={svgRef} width={width} height={height} className="border border-slate-300 rounded-md bg-white"></svg>;
};
    