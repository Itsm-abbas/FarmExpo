/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./app/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        text: "rgb(var(--color-text) / <alpha-value>)",
        background: "rgb(var(--color-background) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",

        // New interactive + selection colors
        hover: "rgb(var(--color-hover) / <alpha-value>)",
        active: "rgb(var(--color-active) / <alpha-value>)",
        selection: "rgb(var(--color-selection) / <alpha-value>)",
      },

      fontFamily: {
        poppins: "var(--font-poppins)",
        inter: "var(--font-inter)",
      },
    },
  },
  plugins: [
    // Add a plugin to handle text selection styling via CSS variables
    function ({ addBase }) {
      addBase({
        "::selection": {
          backgroundColor: "rgb(var(--color-selection) / 0.8)",
          color: "rgb(var(--color-text))",
        },
      });
    },
  ],
};
