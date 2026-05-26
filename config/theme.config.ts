/**
 * LAKSHYA — Central Theme & Font Config
 * Single source of truth. Change here and the whole app updates.
 * Colors are mirrored as CSS variables in src/styles.css.
 */

export const themeConfig = {
  colors: {
    primary: "#1b52a4",   // Deep Blue — main brand
    sky: "#00a2e5",       // Sky Blue — accent / links
    yellow: "#fec40d",    // Yellow — highlight / badges
    orange: "#f58020",    // Orange — secondary CTA
    red: "#d64246",       // Red — alerts / urgency
    green: "#098855",     // Green — success / verified
    ink: "#0f1622",       // Body text
    muted: "#5a6473",     // Secondary text
    line: "#e6e8ec",      // Borders / dividers
    surface: "#ffffff",
    soft: "#f6f8fb",
  },
  fonts: {
    // Loaded via <link> in __root.tsx
    display: `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`,
    body: `'Inter', system-ui, -apple-system, sans-serif`,
    indic: `'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Oriya', system-ui, sans-serif`,
  },
  radius: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    pill: "999px",
  },
} as const;

export type ThemeConfig = typeof themeConfig;
