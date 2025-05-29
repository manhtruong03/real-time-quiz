/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Editor-specific colors using CSS variables
        "editor-primary-bg": "var(--editor-primary-bg)",
        "editor-secondary-bg": "var(--editor-secondary-bg)",
        "editor-content-bg": "var(--editor-content-bg)",
        "editor-text-primary": "var(--editor-text-primary)",
        "editor-text-secondary": "var(--editor-text-secondary)",
        "editor-text-placeholder": "var(--editor-text-placeholder)",
        "editor-accent-color": "var(--editor-accent-color)",
        "editor-accent-hover": "var(--editor-accent-hover)",
        "editor-border-color": "var(--editor-border-color)",
        "editor-input-bg": "var(--editor-input-bg)",
        "editor-danger-color": "var(--editor-danger-color)",
        "editor-danger-hover": "var(--editor-danger-hover)",
        "editor-answer-option-bg": "var(--editor-answer-option-bg)",
        "editor-correct-answer-highlight": "var(--editor-correct-answer-highlight)",
        "answer-icon-triangle": "var(--answer-icon-triangle)",
        "answer-icon-diamond": "var(--answer-icon-diamond)",
        "answer-icon-circle": "var(--answer-icon-circle)",
        "answer-icon-square": "var(--answer-icon-square)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};