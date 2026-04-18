/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "Times", "serif"],
      },
      colors: {
        ink: { DEFAULT: "#111827", muted: "#6b7280" },
        paper: { DEFAULT: "#fafafa", dark: "#0b0f14" },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
