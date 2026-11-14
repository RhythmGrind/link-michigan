import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        industrial: {
          950: "#0b0f17",
          900: "#0f172a",
          850: "#131e35",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
          500: "#64748b",
        },
        michigan: {
          blue: "#00274C",    // U of M / Michigan heritage blue
          maize: "#FFCB05",   // Michigan maize / industrial amber
          neon: "#00f2fe",    // Modern transit cyan
          amber: "#f59e0b",
          emerald: "#10b981",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-roboto-mono)", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;
