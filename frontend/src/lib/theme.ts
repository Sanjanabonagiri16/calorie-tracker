/**
 * Chart colors mirror the CSS custom properties in globals.css.
 * Recharts renders to SVG attributes that need resolved values rather than
 * `var(--token)`, so the palette is duplicated here intentionally — keep the
 * two in sync when the theme changes.
 */
export const CHART = {
  leaf: "#4b642a",
  leafBright: "#7d9a4f",
  lime: "#9bb84c",
  citrus: "#dda32b",
  coral: "#a52121",
  berry: "#7a6ba8",
  grid: "rgba(43, 53, 32, 0.08)",
  cursorLine: "rgba(75, 100, 42, 0.25)",
  cursorFill: "rgba(75, 100, 42, 0.07)",
} as const;
