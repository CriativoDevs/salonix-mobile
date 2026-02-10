/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#3b82f6", // var(--accent-primary) light mode
          primaryHover: "#2563eb", // var(--accent-hover) light mode
          surface: "#ffffff", // var(--bg-primary) light mode
          surfaceForeground: "#0f172a", // var(--text-primary) light mode
          border: "#e2e8f0", // var(--border-primary) light mode
          muted: "#94a3b8", // var(--text-muted) light mode
        },
        success: "#10b981", // green-500
        error: "#ef4444", // red-500
        warning: "#f59e0b", // amber-500
        info: "#3b82f6", // blue-500
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
