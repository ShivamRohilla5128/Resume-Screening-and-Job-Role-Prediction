/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { navy: "#14213D", brand: "#2563EB", surface: "#F8FAFC", ink: "#1E293B", success: "#16A34A", warning: "#F59E0B" },
      boxShadow: { card: "0 1px 2px rgba(20,33,61,.04), 0 6px 20px -8px rgba(20,33,61,.10)", lift: "0 2px 4px rgba(20,33,61,.06), 0 18px 36px -14px rgba(20,33,61,.22)" },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "sans-serif"] },
    },
  },
  plugins: [],
};
