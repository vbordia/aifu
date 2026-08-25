"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import cytoscape, { type ElementDefinition } from "cytoscape";

type CytoscapeGraphProps = {
  elements: ElementDefinition[];
  height?: number;
  interactive?: boolean;
  layout?: cytoscape.LayoutOptions;
  nodeWidth?: number;
  nodeHeight?: number;
  nodeFontSize?: number;
  usePresetPositions?: boolean;
  wide?: boolean;
};

export default function CytoscapeGraph({
  elements,
  height = 300,
  interactive = false,
  layout,
  nodeWidth,
  nodeHeight,
  nodeFontSize,
  usePresetPositions = false,
  wide = false,
}: CytoscapeGraphProps) {
  const ref = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const nw = nodeWidth ?? 34;
  const nh = nodeHeight ?? 34;
  const nfs = nodeFontSize ?? 11;
  const isLargeNode = nw > 50;

  useEffect(() => {
    if (!ref.current) return;

    const defaultLayout: cytoscape.CoseLayoutOptions = {
      name: "cose" as const,
      animate: false,
      padding: 20,
      nodeRepulsion: () => 4000,
      idealEdgeLength: 90,
    };

    const baseNodeStyle: Record<string, unknown> = {
      shape: isLargeNode ? "round-rectangle" : "ellipse",
      "background-color": dark ? "#3b5998" : "#1e40af",
      "border-width": 2,
      "border-color": dark ? "#5b7ec2" : "#1e3a8a",
      label: "data(label)",
      color: "#ffffff",
      "font-size": nfs,
      "font-weight": 700,
      "text-valign": "center",
      "text-halign": "center",
      width: nw,
      height: nh,
      "overlay-opacity": 0,
    };

    if (isLargeNode) {
      baseNodeStyle["text-wrap"] = "wrap";
      baseNodeStyle["text-max-width"] = nw - 12;
      baseNodeStyle["line-height"] = 1.25;
    }

    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const cy = cytoscape({
      container: ref.current,
      elements,
      style: [
        { selector: "node", style: baseNodeStyle },
        {
          selector: "node[type = 'start']",
          style: {
            "background-color": dark ? "#166534" : "#15803d",
            "border-color": dark ? "#22c55e" : "#166534",
            "border-width": 3,
            width: isLargeNode ? nw + 14 : 42,
            height: isLargeNode ? nh + 8 : 42,
            color: "#ffffff",
          },
        },
        {
          selector: "node[type = 'goal']",
          style: {
            "background-color": dark ? "#9f1239" : "#be123c",
            "border-color": dark ? "#fb7185" : "#9f1239",
            "border-width": 3,
            width: isLargeNode ? nw + 14 : 42,
            height: isLargeNode ? nh + 8 : 42,
            color: "#ffffff",
          },
        },
        {
          selector: "node[type = 'current']",
          style: {
            "background-color": dark ? "#92400e" : "#b45309",
            "border-color": dark ? "#fbbf24" : "#92400e",
            "border-width": 3,
            color: "#ffffff",
          },
        },
        {
          selector: "node[type = 'explored']",
          style: {
            "background-color": dark ? "#374151" : "#4b5563",
            "border-color": dark ? "#6b7280" : "#374151",
            "border-width": 2,
            color: "#d1d5db",
          },
        },
        {
          selector: "node[type = 'frontier']",
          style: {
            "background-color": dark ? "#075985" : "#0369a1",
            "border-color": dark ? "#38bdf8" : "#075985",
            "border-width": 3,
            color: "#ffffff",
          },
        },
        {
          selector: "node[type = 'max']",
          style: {
            shape: "round-rectangle",
            "background-color": dark ? "#0c4a6e" : "#0369a1",
            "border-color": dark ? "#38bdf8" : "#0c4a6e",
            "border-width": 2,
            color: "#ffffff",
          },
        },
        {
          selector: "node[type = 'min']",
          style: {
            shape: "ellipse",
            "background-color": dark ? "#7c2d12" : "#b45309",
            "border-color": dark ? "#fbbf24" : "#7c2d12",
            "border-width": 2,
            color: "#ffffff",
          },
        },
        {
          selector: "node[type = 'primitive']",
          style: {
            "background-color": dark ? "#3f3f46" : "#52525b",
            "border-color": dark ? "#a1a1aa" : "#27272a",
            "border-width": 4,
            color: "#ffffff",
          },
        },
        {
          selector: "node[type = 'path']",
          style: {
            "background-color": dark ? "#166534" : "#15803d",
            "border-color": dark ? "#4ade80" : "#166534",
            "border-width": 3,
            color: "#ffffff",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": dark ? "#6b7280" : "#9ca3af",
            "target-arrow-color": dark ? "#6b7280" : "#9ca3af",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            color: dark ? "#d1d5db" : "#374151",
            "font-size": isLargeNode ? 15 : 10,
            "font-weight": 700,
            "text-background-color": dark ? "#111827" : "#ffffff",
            "text-background-opacity": 1,
            "text-background-padding": "4px",
            "overlay-opacity": 0,
          },
        },
        {
          selector: "edge[type = 'path']",
          style: {
            width: 4,
            "line-color": dark ? "#22c55e" : "#16a34a",
            "target-arrow-color": dark ? "#22c55e" : "#16a34a",
          },
        },
        {
          selector: "edge[type = 'active']",
          style: {
            width: 4,
            "line-color": dark ? "#f59e0b" : "#b45309",
            "target-arrow-color": dark ? "#f59e0b" : "#b45309",
          },
        },
        {
          selector: "edge[type = 'pruned']",
          style: {
            "line-style": "dashed",
            width: 2,
            opacity: 0.45,
            "line-color": dark ? "#9f1239" : "#be123c",
            "target-arrow-color": dark ? "#9f1239" : "#be123c",
          },
        },
        {
          selector: "edge[type = 'convex']",
          style: {
            width: 3,
            "line-color": dark ? "#4ade80" : "#15803d",
            "target-arrow-color": dark ? "#4ade80" : "#15803d",
          },
        },
        {
          selector: "edge[type = 'concave']",
          style: {
            width: 3,
            "line-style": "dashed",
            "line-color": dark ? "#38bdf8" : "#0369a1",
            "target-arrow-color": dark ? "#38bdf8" : "#0369a1",
          },
        },
        {
          selector: "edge[type = 'border']",
          style: {
            width: 2,
            "line-style": "dotted",
            opacity: 0.7,
            "line-color": dark ? "#9ca3af" : "#6b7280",
            "target-arrow-shape": "none",
            "target-arrow-color": dark ? "#9ca3af" : "#6b7280",
          },
        },
        {
          selector: "node[type = 'solved']",
          style: {
            shape: "round-rectangle",
            "background-color": dark ? "#4c1d95" : "#6d28d9",
            "border-color": dark ? "#a78bfa" : "#4c1d95",
            "border-width": 3,
            color: "#ffffff",
          },
        },
        {
          selector: "node[type = 'pruned']",
          style: {
            opacity: 0.35,
            "background-color": dark ? "#450a0a" : "#7f1d1d",
            "border-color": dark ? "#9f1239" : "#be123c",
            color: "#ffffff",
          },
        },
        {
          selector: "node[type = 'alpha']",
          style: {
            shape: "round-rectangle",
            "background-color": dark ? "#134e4a" : "#0f766e",
            "border-color": dark ? "#5eead4" : "#134e4a",
            "border-width": 2,
            color: "#ffffff",
          },
        },
        {
          selector: "node[type = 'beta']",
          style: {
            shape: "round-rectangle",
            "background-color": dark ? "#701a37" : "#9d174d",
            "border-color": dark ? "#f9a8d4" : "#701a37",
            "border-width": 2,
            color: "#ffffff",
          },
        },
        {
          selector: "node[type = 'terminal']",
          style: {
            shape: "ellipse",
            "background-color": dark ? "#1e293b" : "#334155",
            "border-color": dark ? "#94a3b8" : "#1e293b",
            "border-width": 2,
            color: "#ffffff",
          },
        },
        {
          selector: "node[type = 'unassigned']",
          style: {
            "background-color": dark ? "#1f2937" : "#e5e7eb",
            "border-color": dark ? "#4b5563" : "#9ca3af",
            "border-width": 2,
            color: dark ? "#d1d5db" : "#374151",
          },
        },
      ],
      layout: layout ?? defaultLayout,
    });

    if (!interactive) {
      cy.userZoomingEnabled(false);
      cy.userPanningEnabled(false);
      cy.autolock(true);
    }

    cy.fit(undefined, 40);

    cyRef.current = cy;

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [elements, dark, interactive, layout, nw, nh, nfs, isLargeNode, usePresetPositions]);

  return (
    <div
      ref={ref}
      style={{ height }}
      className="w-full overflow-hidden bg-foreground/[0.02]"
    />
  );
}
