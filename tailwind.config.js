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
        // ── Superficies (base crema cálida: la foto manda) ──
        surface: "#FBF7F4", // crema (fondo de la app)
        "surface-container-lowest": "#FFFFFF", // cards, drawers, inputs
        "surface-container-low": "#F7F1EE",
        "surface-container": "#F2EAE6",
        "surface-container-high": "#EADFDA",
        // ── Texto y bordes ──
        "on-surface": "#1F1B24", // negro tinta
        "on-surface-variant": "#5E5560", // texto secundario (contraste AA sobre crema)
        outline: "#8E8590", // placeholders e íconos inactivos
        "outline-variant": "#DCD2D4", // bordes suaves
        // ── Marca ──
        primary: {
          DEFAULT: "#E0344B", // rojo Domna: acentos, íconos, lunares
          strong: "#CC2D44", // fondo de botones con texto blanco (contraste AA 4.9:1)
          hover: "#B02639",
          soft: "#FFE8EC", // rosa claro: fondos suaves, chips activos suaves
          rubor: "#FFB8C2", // rosa rubor: detalles
          "on-soft": "#9B1C30", // texto sobre primary-soft
        },
        "on-primary": "#FFFFFF",
        tinta: {
          DEFAULT: "#1F1B24", // botón secundario elegante (negro)
          hover: "#3A333F",
        },
        // ── Semánticos ──
        success: { DEFAULT: "#2E7D5B", container: "#E3F2EA" },
        warning: { DEFAULT: "#B45309", container: "#FDF0DC" },
        error: { DEFAULT: "#B3261E", container: "#FBE4E2" },
        info: { DEFAULT: "#3D5A80", container: "#E6EDF5" },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        marca: ["Playfair Display", "Georgia", "serif"],
      },
      fontSize: {
        "display-marca": ["40px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["28px", { lineHeight: "34px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-md": ["22px", { lineHeight: "28px", fontWeight: "700" }],
        "headline-sm": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "label-lg": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "600" }],
        "label-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.06em", fontWeight: "700" }],
        metric: ["30px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "700" }],
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
        "primary-glow": "0 8px 22px -6px rgba(224,52,75,0.45)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-back": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
