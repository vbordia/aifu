"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import cytoscape, { type ElementDefinition } from "cytoscape";

type CytoscapeGraphProps = {
  elements: ElementDefinition[];
  height?: number;
  interactive?: boolean;
};

export default function CytoscapeGraph({
  elements,
  height = 300,
  interactive = false,
}: CytoscapeGraphProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  useEffect(() => {
    if (!ref.current) return;

    const cy = cytoscape({
      container: ref.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": dark ? "#7aa2f7" : "#2563eb",
            "border-width": 1.5,
            "border-color": dark ? "#82aaff" : "#1d4ed8",
            label: "data(label)",
            color: dark ? "#e6edf3" : "#111827",
            "font-size": 11,
            "font-weight": 500,
            "text-valign": "center",
            "text-halign": "center",
            width: 34,
            height: 34,
            "overlay-opacity": 0,
          },
        },
        {
          selector: "node[type = 'start']",
          style: {
            "background-color": dark ? "#9ece6a" : "#16a34a",
            "border-color": dark ? "#b5e890" : "#15803d",
          },
        },
        {
          selector: "node[type = 'goal']",
          style: {
            "background-color": dark ? "#f7768e" : "#dc2626",
            "border-color": dark ? "#ff9e64" : "#b91c1c",
            width: 40,
            height: 40,
          },
        },
        {
          selector: "node[type = 'current']",
          style: {
            "background-color": dark ? "#ff9e64" : "#f59e0b",
            "border-color": dark ? "#ffb86c" : "#d97706",
            "border-width": 3,
          },
        },
        {
          selector: "node[type = 'explored']",
          style: {
            "background-color": dark ? "#565f89" : "#6b7280",
            "border-color": dark ? "#787f9d" : "#9ca3af",
          },
        },
        {
          selector: "node[type = 'frontier']",
          style: {
            "background-color": dark ? "#7dcfff" : "#0ea5e9",
            "border-color": dark ? "#89ddff" : "#0284c7",
            "border-width": 2.5,
          },
        },
        {
          selector: "node[type = 'path']",
          style: {
            "background-color": dark ? "#9ece6a" : "#22c55e",
            "border-color": dark ? "#b5e890" : "#16a34a",
            "border-width": 2.5,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": dark ? "#565f89" : "#9ca3af",
            "target-arrow-color": dark ? "#565f89" : "#9ca3af",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            color: dark ? "#9aa5ce" : "#6b7280",
            "font-size": 10,
            "text-background-color": dark ? "#16161e" : "#ffffff",
            "text-background-opacity": 0.8,
            "text-background-padding": "2px",
            "overlay-opacity": 0,
          },
        },
        {
          selector: "edge[type = 'path']",
          style: {
            width: 3,
            "line-color": dark ? "#9ece6a" : "#22c55e",
            "target-arrow-color": dark ? "#9ece6a" : "#22c55e",
          },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        padding: 20,
        nodeRepulsion: () => 4000,
        idealEdgeLength: 90,
      },
    });

    if (!interactive) {
      cy.userZoomingEnabled(false);
      cy.userPanningEnabled(false);
      cy.autolock(true);
    }

    cy.fit(undefined, 24);

    return () => {
      cy.destroy();
    };
  }, [elements, dark, interactive]);

  return (
    <div
      ref={ref}
      style={{ height }}
      className="my-5 w-full rounded-lg border border-foreground/[0.08] bg-foreground/[0.02]"
    />
  );
}