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
      // Color definitions:
      //
      // 1. Semantic Colors (e.g., border, background, primary):
      //    - These use the `hsl(var(--variable-name))` pattern.
      //    - The corresponding CSS custom property (e.g., `--border`) in `globals.css`
      //      MUST be defined with HSL *components* (e.g., `240 5.9% 90%`).
      //    - Tailwind constructs the `hsl()` color string from these components.
      //
      // 2. Editor-Specific Colors (e.g., editor-primary-bg):
      //    - These use the `var(--variable-name)` pattern.
      //    - The corresponding CSS custom property (e.g., `--editor-primary-bg`)
      //      in `globals.css` can be any valid CSS color string (HEX, HSL string, RGB string).
      //    - Tailwind passes the `var()` directly to the CSS, letting the browser resolve it.
      colors: {
        // Semantic colors - require HSL components in CSS variables
        border: "hsl(var(--border))", // Expects --border: H S% L%
        input: "hsl(var(--input))",   // Expects --input: H S% L%
        ring: "hsl(var(--ring))",     // Expects --ring: H S% L%
        background: "hsl(var(--background))", // Expects --background: H S% L%
        foreground: "hsl(var(--foreground))", // Expects --foreground: H S% L%
        primary: {
          DEFAULT: "hsl(var(--primary))", // Expects --primary: H S% L%
          foreground: "hsl(var(--primary-foreground))", // Expects --primary-foreground: H S% L%
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))", // Expects --secondary: H S% L%
          foreground: "hsl(var(--secondary-foreground))", // Expects --secondary-foreground: H S% L%
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))", // Expects --destructive: H S% L%
          foreground: "hsl(var(--destructive-foreground))", // Expects --destructive-foreground: H S% L%
        },
        muted: {
          DEFAULT: "hsl(var(--muted))", // Expects --muted: H S% L%
          foreground: "hsl(var(--muted-foreground))", // Expects --muted-foreground: H S% L%
        },
        accent: {
          DEFAULT: "hsl(var(--accent))", // Expects --accent: H S% L%
          foreground: "hsl(var(--accent-foreground))", // Expects --accent-foreground: H S% L%
        },
        popover: {
          DEFAULT: "hsl(var(--popover))", // Expects --popover: H S% L%
          foreground: "hsl(var(--popover-foreground))", // Expects --popover-foreground: H S% L%
        },
        card: {
          DEFAULT: "hsl(var(--card))", // Expects --card: H S% L%
          foreground: "hsl(var(--card-foreground))", // Expects --card-foreground: H S% L%
        },
        constructive: {
          DEFAULT: "hsl(var(--constructive))",
          foreground: "hsl(var(--constructive-foreground))",
        },

        // Editor-specific colors - use CSS variables directly (can be HEX, HSL string, etc. in CSS)
        // These variables are defined in `globals.css` (e.g., --editor-primary-bg: #1E1E24).
        // Tailwind will output `color: var(--editor-primary-bg);` etc.
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
          from: { height: "0" }, // Changed from 0 to "0" to be a valid CSS value
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }, // Changed from 0 to "0"
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