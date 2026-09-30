export type PlotTheme = "light" | "dark";

export function plotAxisColors(theme: PlotTheme) {
  return {
    axis: theme === "dark" ? "#94a3b8" : "#4a5568",
    tick: theme === "dark" ? "#94a3b8" : "#5c6370",
  };
}

/** Ejes sólidos con ticks, sin cuadrícula interior (estilo ggplot theme_light). */
export function plotAxisScaleOptions(_theme: PlotTheme) {
  return {
    grid: false,
    line: true,
    tickSize: 6,
    label: null as string | null,
  };
}

export function stylePlotSvg(svg: SVGSVGElement | null, theme: PlotTheme) {
  if (!svg) return;
  const { tick, axis } = plotAxisColors(theme);
  svg.querySelectorAll("text").forEach((node) => {
    const el = node as SVGTextElement;
    if (el.getAttribute("fill") === null || el.getAttribute("fill") === "currentColor") {
      el.setAttribute("fill", tick);
    }
    if (!el.getAttribute("font-size")) {
      el.setAttribute("font-size", "11");
    }
  });
  svg.querySelectorAll("line").forEach((node) => {
    const el = node as SVGLineElement;
    const cls = el.getAttribute("class") ?? "";
    if (cls.includes("grid") || el.getAttribute("stroke-dasharray")) return;
    el.setAttribute("stroke", axis);
  });
}
