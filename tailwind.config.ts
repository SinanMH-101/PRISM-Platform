import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--color-primary)",
          secondary: "var(--color-secondary)",
          background: "var(--color-background)",
          surface: "var(--color-surface)",
          text: "var(--color-text)",
          muted: "var(--color-muted)",
          border: "var(--color-border)"
        }
      },
      boxShadow: {
        soft: "var(--shadow-soft)"
      }
    },
  },
  plugins: [],
};

export default config;
