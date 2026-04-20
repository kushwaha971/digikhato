import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface-2)",
        text: "var(--text)",
        muted: "var(--muted)",
        border: "var(--border)",
        // Crimson/hot-pink primary — matches Turno brand style
        primary: {
          50: "#fde7ef",
          100: "#fbbfd4",
          200: "#f792b2",
          300: "#f36690",
          400: "#ef4170",
          500: "#e03060",   // brand primary
          600: "#c42a55",   // hover
          700: "#a8254a",
          800: "#8c1f3e",
          900: "#701932",
        },
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        neutral: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        // Keep accent/brand aliases pointing to crimson
        accent: {
          50: "#fde7ef",
          100: "#fbbfd4",
          500: "#e03060",
          600: "#c42a55",
          700: "#a8254a",
        },
        brand: {
          50: "#fde7ef",
          100: "#fbbfd4",
          500: "#e03060",
          700: "#a8254a",
        },
        emerald: {
          500: "#059669",
          600: "#047857",
        },
      },
      backgroundImage: {
        // Crimson-based gradients
        "gradient-brand":   "linear-gradient(135deg, #c42a55 0%, #e03060 55%, #f04578 100%)",
        "gradient-primary": "linear-gradient(135deg, #c42a55 0%, #e03060 55%, #f04578 100%)",
        "gradient-success": "linear-gradient(135deg, #047857 0%, #059669 100%)",
        "gradient-warning": "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
        "gradient-danger":  "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
        "gradient-dark":    "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
        "gradient-hero":    "linear-gradient(130deg, #c42a55 0%, #e03060 45%, #f04578 100%)",
        "gradient-card":    "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
        "gradient-mesh":    "radial-gradient(at 40% 20%, rgba(224,48,96,0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(196,42,85,0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(16,185,129,0.06) 0px, transparent 50%)",
      },
      boxShadow: {
        soft:         "0 14px 40px rgba(224, 48, 96, 0.18)",
        card:         "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 18px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)",
        panel:        "0 12px 35px rgba(15, 23, 42, 0.07)",
        modal:        "0 25px 60px rgba(0,0,0,0.18)",
        glow:         "0 0 28px rgba(224, 48, 96, 0.22)",
        "glow-success": "0 0 20px rgba(16,185,129,0.2)",
      },
      borderRadius: {
        xl2:  "1rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      fontFamily: {
        sans: ["Poppins", "Noto Sans", "Hind", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      spacing: {
        "18":         "4.5rem",
        "22":         "5.5rem",
        "sidebar":    "16rem",
        "sidebar-sm": "4rem",
      },
      animation: {
        "fade-in":    "fadeIn 0.2s ease-in-out",
        "slide-up":   "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer:      "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn:    { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:   { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pulseSoft: { "0%, 100%": { opacity: "1" }, "50%": { opacity: ".6" } },
        shimmer:   { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [],
};

export default config;
