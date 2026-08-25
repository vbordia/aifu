"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import mermaid from "mermaid";

const FONT_FAMILY =
  "var(--font-inter), ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const LIGHT_THEME = {
  fontFamily: FONT_FAMILY,
  fontSize: "14px",
  lineColor: "#64748b",
  textColor: "#0f172a",
  primaryColor: "#e0e7ff",
  primaryTextColor: "#1e1b4b",
  primaryBorderColor: "#6366f1",
  secondaryColor: "#f1f5f9",
  secondaryTextColor: "#334155",
  secondaryBorderColor: "#cbd5e1",
  tertiaryColor: "#ffffff",
  tertiaryTextColor: "#334155",
  tertiaryBorderColor: "#e2e8f0",
  background: "transparent",
  mainBkg: "#e0e7ff",
  nodeBorder: "#a5b4fc",
  clusterBkg: "#f8fafc",
  clusterBorder: "#cbd5e1",
  clusterTitle: "#334155",
  edgeLabelBackground: "#ffffff",
  edgeLabelColor: "#0f172a",
  titleColor: "#0f172a",
  noteBkgColor: "#fef9c3",
  noteTextColor: "#422006",
  noteBorderColor: "#eab308",
  actorBkg: "#e0e7ff",
  actorBorder: "#818cf8",
  actorTextColor: "#1e1b4b",
  actorLineColor: "#94a3b8",
  signalColor: "#94a3b8",
  signalTextColor: "#334155",
  labelBoxBkgColor: "#e0e7ff",
  labelBoxBorderColor: "#818cf8",
  labelTextColor: "#1e1b4b",
  loopTextColor: "#1e1b4b",
  activationBkgColor: "#e0e7ff",
  activationBorderColor: "#818cf8",
  sequenceNumberColor: "#ffffff",
  sectionBkgColor: "#f1f5f9",
  altSectionBkgColor: "#ffffff",
  separatorColor: "#94a3b8",
  taskBorderColor: "#94a3b8",
  taskBkgColor: "#e0e7ff",
  taskTextColor: "#0f172a",
  taskTextLightColor: "#475569",
  taskTextOutsideColor: "#0f172a",
  taskTextClickableColor: "#4338ca",
  activeTaskBorderColor: "#4338ca",
  activeTaskBkgColor: "#c7d2fe",
  gridColor: "#e2e8f0",
  doneTaskBkgColor: "#f1f5f9",
  doneTaskBorderColor: "#cbd5e1",
  critBkgColor: "#fee2e2",
  critBorderColor: "#ef4444",
  todayLineColor: "#ef4444",
  pie1: "#6366f1",
  pie2: "#a855f7",
  pie3: "#ec4899",
  pie4: "#f59e0b",
  pie5: "#10b981",
  pie6: "#0ea5e9",
  pie7: "#8b5cf6",
  pie8: "#ef4444",
  pie9: "#84cc16",
  pie10: "#14b8a6",
  pie11: "#f97316",
  pie12: "#06b6d4",
};

const DARK_THEME = {
  fontFamily: FONT_FAMILY,
  fontSize: "14px",
  lineColor: "#94a3b8",
  textColor: "#e2e8f0",
  primaryColor: "#312e81",
  primaryTextColor: "#e0e7ff",
  primaryBorderColor: "#6366f1",
  secondaryColor: "#1e293b",
  secondaryTextColor: "#cbd5e1",
  secondaryBorderColor: "#334155",
  tertiaryColor: "#0f172a",
  tertiaryTextColor: "#cbd5e1",
  tertiaryBorderColor: "#334155",
  background: "transparent",
  mainBkg: "#312e81",
  nodeBorder: "#4f46e5",
  clusterBkg: "#1e293b",
  clusterBorder: "#475569",
  clusterTitle: "#cbd5e1",
  edgeLabelBackground: "#0f172a",
  edgeLabelColor: "#e2e8f0",
  titleColor: "#e2e8f0",
  noteBkgColor: "#713f12",
  noteTextColor: "#fef08a",
  noteBorderColor: "#a16207",
  actorBkg: "#312e81",
  actorBorder: "#6366f1",
  actorTextColor: "#e0e7ff",
  actorLineColor: "#64748b",
  signalColor: "#64748b",
  signalTextColor: "#cbd5e1",
  labelBoxBkgColor: "#312e81",
  labelBoxBorderColor: "#6366f1",
  labelTextColor: "#e0e7ff",
  loopTextColor: "#e0e7ff",
  activationBkgColor: "#312e81",
  activationBorderColor: "#6366f1",
  sequenceNumberColor: "#e0e7ff",
  sectionBkgColor: "#1e293b",
  altSectionBkgColor: "#0f172a",
  separatorColor: "#64748b",
  taskBorderColor: "#64748b",
  taskBkgColor: "#312e81",
  taskTextColor: "#e2e8f0",
  taskTextLightColor: "#94a3b8",
  taskTextOutsideColor: "#e2e8f0",
  taskTextClickableColor: "#a5b4fc",
  activeTaskBorderColor: "#a5b4fc",
  activeTaskBkgColor: "#4338ca",
  gridColor: "#1e293b",
  doneTaskBkgColor: "#1e293b",
  doneTaskBorderColor: "#475569",
  critBkgColor: "#7f1d1d",
  critBorderColor: "#f87171",
  todayLineColor: "#f87171",
  pie1: "#6366f1",
  pie2: "#a855f7",
  pie3: "#ec4899",
  pie4: "#f59e0b",
  pie5: "#10b981",
  pie6: "#0ea5e9",
  pie7: "#8b5cf6",
  pie8: "#ef4444",
  pie9: "#84cc16",
  pie10: "#14b8a6",
  pie11: "#f97316",
  pie12: "#06b6d4",
};

type MermaidProps = {
  chart: string;
  wide?: boolean;
  fit?: boolean;
  natural?: boolean;
};

let idCounter = 0;

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function Mermaid({ chart, wide = false, fit = false, natural = false }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "base",
      fontFamily: FONT_FAMILY,
      fontSize: 14,
      flowchart: { useMaxWidth: !wide && !fit && !natural, htmlLabels: true, curve: "basis" },
      timeline: { useMaxWidth: !wide && !fit && !natural },
      themeVariables: dark ? DARK_THEME : LIGHT_THEME,
    });

    let cancelled = false;

    const render = async () => {
      try {
        idCounter += 1;
        const id = `mermaid-${idCounter}-${Date.now()}`;
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        // ignore render errors during navigation
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [chart, dark, wide, fit, natural, mounted]);

  return (
    <div
      ref={containerRef}
      className={
        wide
          ? "mermaid-output mermaid-wide"
          : fit
            ? "mermaid-output mermaid-fit"
            : natural
              ? "mermaid-output mermaid-natural"
              : "mermaid-output"
      }
      style={{ minHeight: 32 }}
      suppressHydrationWarning
    />
  );
}
