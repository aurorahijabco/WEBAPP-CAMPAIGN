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
        },
        gold: {
          400: "#C9A374",
        },
        cream: {
          50: "#FBF6F1",
          100: "#F4E6E1",
          200: "#EFDAD3",
        },
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
