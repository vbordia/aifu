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
      baseNodeStyle["text-line-height"] = 1.25;
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
