"use client";

import CytoscapeGraph from "@/components/ui/cytoscape";

export default function StateSpaceGraph() {
  return (
    <CytoscapeGraph
      elements={[
        { data: { id: "start", label: "Start", type: "start" } },
        { data: { id: "a", label: "A" } },
        { data: { id: "b", label: "B" } },
        { data: { id: "c", label: "C" } },
        { data: { id: "d", label: "D" } },
        { data: { id: "goal", label: "Goal", type: "goal" } },
        { data: { id: "e1", source: "start", target: "a", label: "move" } },
        { data: { id: "e2", source: "start", target: "b", label: "move" } },
        { data: { id: "e3", source: "a", target: "c", label: "move" } },
        { data: { id: "e4", source: "a", target: "d", label: "move" } },
        { data: { id: "e5", source: "b", target: "goal", label: "move" } },
        { data: { id: "e6", source: "c", target: "goal", label: "move" } },
        { data: { id: "e7", source: "d", target: "goal", label: "move" } },
      ]}
    />
  );
}