/**
 * Tokens del design system de Domna. Fuente de verdad del color, tipografía, radios y sombras.
 * Regla: los componentes usan SOLO estos tokens (nada de hex sueltos). Ver docs/DESIGN-SYSTEM.md.
 * Las animaciones viven en src/styles/index.css (CSS plano, recarga en caliente).
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Superficies (Opción C: crema editorial — casi blanco, sin tinte durazno/café) ──
        surface: "#FAF8F6", // fondo de la app
        "surface-container-lowest": "#FFFFFF", // cards, drawers, inputs
        "surface-container-low": "#F6F2EF",
        "surface-container": "#F0EAE6",
        "surface-container-high": "#E8E0DA",
        // ── Texto y bordes ──
        "on-surface": "#1F1D21", // tinta (no negro puro)
        "on-surface-variant": "#5C5560", // texto secundario (contraste AA sobre crema)
        outline: "#8D8590", // placeholders e íconos inactivos
        "outline-variant": "#DDD5D2", // bordes suaves
        // ── Marca (white-label) ──
        // Se leen de variables CSS (src/styles/index.css) como canales RGB, para que cada boutique
        // pueda sustituirlos en ejecución (src/lib/paletaMarca.ts) y siga funcionando `bg-primary/10`.
        primary: {
          DEFAULT: "rgb(var(--marca) / <alpha-value>)", // acentos, íconos, enlaces (AA sobre crema)
          strong: "rgb(var(--marca-strong) / <alpha-value>)", // fondo de botones con texto blanco (AA)
          hover: "rgb(var(--marca-hover) / <alpha-value>)",
          soft: "rgb(var(--marca-soft) / <alpha-value>)", // fondos suaves, chips activos
          rubor: "rgb(var(--marca-rubor) / <alpha-value>)", // detalles
          "on-soft": "rgb(var(--marca-on-soft) / <alpha-value>)", // texto sobre primary-soft
        },
        "on-primary": "#FFFFFF",
        // Color de la marca tal cual (el del ícono de la PWA): halo del encabezado.
        orbe: "rgb(var(--marca-orbe) / <alpha-value>)",
        tinta: {
          DEFAULT: "#1F1D21", // botón secundario elegante (no negro puro, alineado a on-surface)
          hover: "#3A353C",
        },
        // ── Semánticos ──
        success: { DEFAULT: "#2E7D5B", container: "#E3F2EA" },
        warning: { DEFAULT: "#B45309", container: "#FDF0DC" },
        error: { DEFAULT: "#B3261E", container: "#FBE4E2" },
        info: { DEFAULT: "#3D5A80", container: "#E6EDF5" },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        marca: ["Fraunces", "Georgia", "serif"],
      },
      fontSize: {
        "display-marca": ["40px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-lg": ["28px", { lineHeight: "34px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md": ["22px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-sm": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "label-lg": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "600" }],
        "label-sm": ["11.5px", { lineHeight: "15px", letterSpacing: "0.02em", fontWeight: "600" }],
        metric: ["30px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "600" }],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
        "3xl": "28px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(31,27,36,0.05)",
        soft: "0 2px 10px -3px rgba(31,27,36,0.08), 0 1px 3px -1px rgba(31,27,36,0.04)",
        lift: "0 12px 28px -6px rgba(31,27,36,0.14), 0 4px 10px -2px rgba(31,27,36,0.05)",
        float: "0 24px 48px -12px rgba(31,27,36,0.28)",
        "primary-glow": "0 8px 22px -6px rgb(var(--marca) / 0.45)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-back": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
