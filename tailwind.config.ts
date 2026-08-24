import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plum: {
          50: "#F5EDE8",
          100: "#F0D6DC",
          200: "#E8C4CC",
          300: "#C9A8B0",
          400: "#54293A",
          500: "#4A2A36",
          600: "#3B1F2B",
          700: "#241A1F",
          900: "#1A1216",
        },
        rose: {
          100: "#FBE9E9",
          200: "#E9C3C7",
          300: "#E8C4CC",
          500: "#C97B84",
        },
        gold: {
          300: "#D4B896",
          400: "#C9A374",
          500: "#B08A54",
        },
        cream: {
          50: "#FBF6F1",
          100: "#F4E6E1",
          200: "#EFDAD3",
        },
        success: { DEFAULT: "#3F7D58", bg: "#E5F1E9" },
        warn: { DEFAULT: "#B8863B", bg: "#FBF1DE" },
        danger: { DEFAULT: "#B23A3A", bg: "#FBE9E9" },
        hold: { DEFAULT: "#6E5A9E", bg: "#EEEAF7" },
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        "4xl": "2rem",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(59,31,43,0.06), 0 1px 2px rgba(59,31,43,0.05)",
        pop: "0 16px 40px -6px rgba(59,31,43,0.18), 0 4px 10px -4px rgba(59,31,43,0.10)",
      },
    },
  },
  plugins: [],
};
export default config;
